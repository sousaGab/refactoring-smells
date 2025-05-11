import { join, resolve } from 'node:path'
import { Construct } from 'constructs'
import { CfnOutput, Duration, Fn, Stack } from 'aws-cdk-lib/core'
import { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Cors } from 'aws-cdk-lib/aws-apigateway'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import { CorsHttpMethod, HttpApi, HttpMethod, CfnStage, DomainName } from 'aws-cdk-lib/aws-apigatewayv2'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import Auth from './Auth'
import { getEnvironmentConfig, getEnvironmentName } from '../environment-config'
import CustomNodejsFunction from './CustomNodejsFunction'
import { FunctionUrl, FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'
import {
  AllowedMethods,
  CachePolicy,
  CfnDistribution,
  CfnOriginAccessControl,
  Distribution,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  ResponseHeadersPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { FunctionUrlOrigin, HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'

interface ExpressApiProps {
  auth: Auth
  todoListTable: ITable
  todoItemTable: ITable
  userTable: ITable
}

export default class ExpressApi extends Construct {
  public readonly api: HttpApi
  public readonly lambdaFunction: NodejsFunction
  public readonly lambdaFunctionUrl: FunctionUrl
  public readonly cloudFrontDistribution: Distribution
  constructor(scope: Construct, id: string, props: ExpressApiProps) {
    super(scope, id)
    const { lambdaFunction, lambdaFunctionUrl } = this.createLambdaFunction({ props })
    this.lambdaFunction = lambdaFunction
    this.lambdaFunctionUrl = lambdaFunctionUrl
    this.api = this.createApi({ auth: props.auth })
    this.cloudFrontDistribution = this.createCloudFrontDistribution()
  }

  createCloudFrontDistribution() {
    const cloudFrontDistribution = new Distribution(this, 'CloudFrontDistribution', {
      enableLogging: true,
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        origin: new FunctionUrlOrigin(this.lambdaFunctionUrl),
        cachePolicy: new CachePolicy(this, 'CachePolicy', {
          minTtl: Duration.seconds(0),
          maxTtl: Duration.seconds(0),
          defaultTtl: Duration.seconds(0),
        }),
        originRequestPolicy: new OriginRequestPolicy(this, 'OriginRequestPolicy', {
          cookieBehavior: OriginRequestCookieBehavior.all(),
          queryStringBehavior: OriginRequestQueryStringBehavior.all(),
          headerBehavior: OriginRequestHeaderBehavior.denyList('host'),
        }),
      },
    })

    // NOTE: OAC currently isn't viable for APIs for two reasons:
    // 1. It doesn't sign PUT/POST payloads
    // 2. It overrides the Authorization header. You *may* be able to get around this with a CloudFront or Lambda@Edge Viewer Request Function that maps the
    //    Authorization header to something else (e.g. x-client-authorization) and update the Express app to check that header instead (untested whether the original
    //    Authorization header is available at that point). Alternatively, you could simply use a different on the client, but this is moving the problem to the client.
    // If you want to try OAC anyway, uncomment the below lines and change the Lambda Function URL authType from FunctionUrlAuthType.NONE to FunctionUrlAuthType.AWS_IAM
    // const cloudFrontDistributionArn = `arn:aws:cloudfront::${Stack.of(this).account}:distribution/${cloudFrontDistribution.distributionId}`

    // this.lambdaFunction.addPermission('AllowCloudFrontPrincipalInvoke', {
    //   principal: new ServicePrincipal('cloudfront.amazonaws.com'),
    //   action: 'lambda:InvokeFunctionUrl',
    //   sourceArn: cloudFrontDistributionArn,
    // })

    // const cloudFrontOriginAccessControl = new CfnOriginAccessControl(this, 'CloudFrontOriginAccessControl', {
    //   originAccessControlConfig: {
    //     name: `ExpressApi_${this.node.addr}`,
    //     originAccessControlOriginType: 'lambda',
    //     signingBehavior: 'always', // 'always' | 'never'
    //     signingProtocol: 'sigv4',
    //   },
    // })

    // // NOTE: CDK doesn't natively support adding OAC yet https://github.com/aws/aws-cdk/issues/21771
    // const cfnDistribution = cloudFrontDistribution.node.defaultChild as CfnDistribution
    // cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', cloudFrontOriginAccessControl.getAtt('Id'))

    new CfnOutput(this, 'CloudFrontDistributionUrl', {
      key: 'CloudFrontDistributionUrl',
      value: `https://${cloudFrontDistribution.distributionDomainName}`,
    })

    return cloudFrontDistribution
  }

  createLambdaFunction({ props }: { props: ExpressApiProps }) {
    const environmentConfig = getEnvironmentConfig(this.node)
    const apiPackageDir = resolve(import.meta.dirname, '../../../api')
    const lambdaFunction = new CustomNodejsFunction(this, 'LambdaFunction', {
      function: {
        entry: join(apiPackageDir, 'lambda.ts'),
        timeout: Duration.seconds(28),
        environment: {
          TODO_LIST_TABLE: props.todoListTable.tableName,
          TODO_ITEM_TABLE: props.todoItemTable.tableName,
          USER_TABLE: props.userTable.tableName,
          COGNITO_USER_POOL_ID: props.auth.userPool.userPoolId,
          COGNITO_USER_POOL_CLIENT_ID: props.auth.userPoolClient.userPoolClientId,
        },
      },
    }).function

    this.grantLambdaFunctionDynamoDbReadWritePermissions({ lambdaFunction, props })

    const lambdaFunctionUrl = lambdaFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    })

    new CfnOutput(this, 'ExpressApiFunctionUrl', { key: 'ExpressApiFunctionUrl', value: lambdaFunctionUrl.url })

    return {
      lambdaFunction,
      lambdaFunctionUrl,
    }
  }

  grantLambdaFunctionDynamoDbReadWritePermissions({ lambdaFunction, props }: { lambdaFunction: NodejsFunction; props: ExpressApiProps }) {
    // Grant the Lambda function permission to read and write to DynamoDB
    const dynamoDBReadWritePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
        'dynamodb:DeleteItem',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:UpdateItem',
      ],
      resources: [
        props.todoListTable.tableArn,
        Fn.join('', [props.todoListTable.tableArn, '/index/*']),
        props.todoItemTable.tableArn,
        Fn.join('', [props.todoItemTable.tableArn, '/index/*']),
        props.userTable.tableArn,
        Fn.join('', [props.userTable.tableArn, '/index/*']),
      ],
    })
    lambdaFunction.addToRolePolicy(dynamoDBReadWritePolicy)
  }

  createApi({ auth }: { auth: Auth }) {
    const authorizer = new HttpUserPoolAuthorizer('Authorizer', auth.userPool, {
      userPoolClients: [auth.userPoolClient],
    })
    const integration = new HttpLambdaIntegration('LambdaIntegration', this.lambdaFunction)
    const environmentConfig = getEnvironmentConfig(this.node)
    const domainName = environmentConfig.api?.domainName
    let domainResource

    if (domainName) {
      const certificate = new Certificate(this, 'Certificate', {
        domainName,
      })
      domainResource = new DomainName(this, 'DomainName', {
        domainName,
        certificate,
      })
    }

    const api = new HttpApi(this, 'HttpApi')
    api.addRoutes({
      path: '/{proxy+}',
      integration,
      authorizer,
      methods: [HttpMethod.ANY],
    })
    api.addRoutes({
      path: '/{proxy+}',
      integration,
      methods: [HttpMethod.OPTIONS],
    })

    // this.enableApiAccessLogs({ api })

    new CfnOutput(this, 'ApiEndpoint', { key: 'ApiEndpoint', value: domainResource ? api.defaultStage!.domainUrl : api.apiEndpoint })

    if (domainResource) {
      new CfnOutput(this, 'RegionalDomainName', {
        key: 'RegionalDomainName',
        value: domainResource.regionalDomainName,
        description: `You must create a CNAME record in your DNS using ${domainName} and this value`,
      })
    }

    return api
  }

  enableApiAccessLogs({ api }: { api: HttpApi }) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stage = api.defaultStage!.node.defaultChild as CfnStage
    const logGroup = new LogGroup(this, 'AccessLogs', {
      retention: getEnvironmentConfig(this.node).logRetentionInDays,
    })

    stage.accessLogSettings = {
      destinationArn: logGroup.logGroupArn,
      format: JSON.stringify({
        requestId: '$context.requestId',
        userAgent: '$context.identity.userAgent',
        sourceIp: '$context.identity.sourceIp',
        requestTime: '$context.requestTime',
        httpMethod: '$context.httpMethod',
        path: '$context.path',
        status: '$context.status',
        responseLength: '$context.responseLength',
      }),
    }

    logGroup.grantWrite(new ServicePrincipal('apigateway.amazonaws.com'))
  }
}
