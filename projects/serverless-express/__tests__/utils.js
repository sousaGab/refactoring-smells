const { getEventSourceNameBasedOnEvent } = require('../src/event-sources/utils')

/**
This is an event delivered by `sam local start-api`,
using Type:HttpApi, with SAM CLI version 1.18.0.
*/
const samHttpApiEvent = {
  version: '2.0',
  routeKey: 'GET /',
  rawPath: '/',
  rawQueryString: '',
  cookies: [],
  headers: {
    Host: 'localhost:9000',
    'User-Agent': 'curl/7.64.1',
    Accept: '*/*',
    'X-Forwarded-Proto': 'http',
    'X-Forwarded-Port': '9000'
  },
  queryStringParameters: {},
  requestContext: {
    accountId: '123456789012',
    apiId: '1234567890',
    http: {
      method: 'GET',
      path: '/',
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'Custom User Agent String'
    },
    requestId: 'aacf57f7-2fce-4069-a1f2-7cb4726dc028',
    routeKey: 'GET /',
    stage: null
  },
  body: '',
  pathParameters: {},
  stageVariables: null,
  isBase64Encoded: false
}

// Sample event from https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html
const dynamoDbEvent = {
  Records: [
    {
      eventID: '1',
      eventVersion: '1.0',
      dynamodb: {
        Keys: {
          Id: {
            N: '101'
          }
        },
        NewImage: {
          Message: {
            S: 'New item!'
          },
          Id: {
            N: '101'
          }
        },
        StreamViewType: 'NEW_AND_OLD_IMAGES',
        SequenceNumber: '111',
        SizeBytes: 26
      },
      awsRegion: 'us-west-2',
      eventName: 'INSERT',
      eventSourceARN: 'arn:aws:dynamodb:us-east-1:0000000000:mytable',
      eventSource: 'aws:dynamodb'
    },
    {
      eventID: '2',
      eventVersion: '1.0',
      dynamodb: {
        OldImage: {
          Message: {
            S: 'New item!'
          },
          Id: {
            N: '101'
          }
        },
        SequenceNumber: '222',
        Keys: {
          Id: {
            N: '101'
          }
        },
        SizeBytes: 59,
        NewImage: {
          Message: {
            S: 'This item has changed'
          },
          Id: {
            N: '101'
          }
        },
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      awsRegion: 'us-west-2',
      eventName: 'MODIFY',
      eventSourceARN: 'arn:aws:dynamodb:us-east-1:0000000000:mytable',
      eventSource: 'aws:dynamodb'
    }
  ]
}

// Sample event from https://docs.aws.amazon.com/lambda/latest/dg/with-sns.html
const snsEvent = {
  Records: [
    {
      EventVersion: '1.0',
      EventSubscriptionArn:
        'arn:aws:sns:us-east-2:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486',
      EventSource: 'aws:sns',
      Sns: {
        SignatureVersion: '1',
        Timestamp: '2019-01-02T12:45:07.000Z',
        Signature: 'tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==',
        SigningCertUrl:
          'https://sns.us-east-2.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem',
        MessageId: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
        Message: 'Hello from SNS!',
        MessageAttributes: {
          Test: {
            Type: 'String',
            Value: 'TestString'
          },
          TestBinary: {
            Type: 'Binary',
            Value: 'TestBinary'
          }
        },
        Type: 'Notification',
        UnsubscribeUrl:
          'https://sns.us-east-2.amazonaws.com/?Action=Unsubscribe&amp;SubscriptionArn=arn:aws:sns:us-east-2:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486',
        TopicArn: 'arn:aws:sns:us-east-2:123456789012:sns-lambda',
        Subject: 'TestInvoke'
      }
    }
  ]
}

// Sample event from https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
const sqsEvent = {
  Records: [
    {
      messageId: '059f36b4-87a3-44ab-83d2-661975830a7d',
      receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...',
      body: 'Test message.',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1545082649183',
        SenderId: 'AIDAIENQZJOLO23YVJ4VO',
        ApproximateFirstReceiveTimestamp: '1545082649185'
      },
      messageAttributes: {},
      md5OfBody: 'e4e68fb7bd0e697a0ae8f1bb342846b3',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-2:123456789012:my-queue',
      awsRegion: 'us-east-2'
    }
  ]
}

// Sample event from https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchevents.html
const eventbridgeEvent = {
  version: '0',
  id: 'fe8d3c65-xmpl-c5c3-2c87-81584709a377',
  'detail-type': 'RDS DB Instance Event',
  source: 'aws.rds',
  account: '123456789012',
  time: '2020-04-28T07:20:20Z',
  region: 'us-east-2',
  resources: ['arn:aws:rds:us-east-2:123456789012:db:rdz6xmpliljlb1'],
  detail: {
    EventCategories: ['backup'],
    SourceType: 'DB_INSTANCE',
    SourceArn: 'arn:aws:rds:us-east-2:123456789012:db:rdz6xmpliljlb1',
    Date: '2020-04-28T07:20:20.112Z',
    Message: 'Finished DB Instance backup',
    SourceIdentifier: 'rdz6xmpliljlb1'
  }
}

const eventbridgeScheduledEvent = {
  version: '0',
  account: '123456789012',
  region: 'us-east-2',
  detail: {},
  'detail-type': 'Scheduled Event',
  source: 'aws.events',
  time: '2019-03-01T01:23:45Z',
  id: 'cdc73f9d-aea9-11e3-9d5a-835b769c0d9c',
  resources: ['arn:aws:events:us-east-2:123456789012:rule/my-schedule']
}

const eventbridgeCustomerEvent = {
  version: '0',
  id: 'fe8d3c65-xmpl-c5c3-2c87-81584709a377',
  source: 'com.mycompany.myapp',
  account: '123456789012',
  time: '2016-01-14T01:02:03Z',
  region: 'us-east-2',
  resources: [
    'resource1',
    'resource2'
  ],
  'detail-type': 'myDetailType',
  detail: {}
}

// Sample event from https://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example.html
const kinesisDataStreamEvent = {
  Records: [
    {
      kinesis: {
        kinesisSchemaVersion: '1.0',
        partitionKey: '1',
        sequenceNumber: '49590338271490256608559692538361571095921575989136588898',
        data: 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0Lg==',
        approximateArrivalTimestamp: 1545084650.987
      },
      eventSource: 'aws:kinesis',
      eventVersion: '1.0',
      eventID: 'shardId-000000000006:49590338271490256608559692538361571095921575989136588898',
      eventName: 'aws:kinesis:record',
      invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-kinesis-role',
      awsRegion: 'us-east-2',
      eventSourceARN: 'arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream'
    }
  ]
}

// Sample event from https://docs.aws.amazon.com/lambda/latest/dg/with-kafka.html
const selfManagedKafkaEvent = {
  eventSource: 'SelfManagedKafka',
  bootstrapServers: 'b-2.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092,b-1.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
  records: {
    'mytopic-0': [
      {
        topic: 'mytopic',
        partition: 0,
        offset: 15,
        timestamp: 1545084650987,
        timestampType: 'CREATE_TIME',
        key: 'abcDEFghiJKLmnoPQRstuVWXyz1234==',
        value: 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0Lg==',
        headers: [
          {
            headerKey: [
              104,
              101,
              97,
              100,
              101,
              114,
              86,
              97,
              108,
              117,
              101
            ]
          }
        ]
      }
    ]
  }
}

describe('getEventSourceNameBasedOnEvent', () => {
  test('throws error on empty event', () => {
    expect(() => getEventSourceNameBasedOnEvent({ event: {} })).toThrow(
      'Unable to determine event source based on event.'
    )
  })

  test('recognizes sam local HttpApi event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: samHttpApiEvent })
    expect(result).toEqual('AWS_API_GATEWAY_V2')
  })

  test('recognizes dynamodb event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: dynamoDbEvent })
    expect(result).toEqual('AWS_DYNAMODB')
  })

  test('recognizes sns event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: snsEvent })
    expect(result).toEqual('AWS_SNS')
  })

  test('recognizes sqs event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: sqsEvent })
    expect(result).toEqual('AWS_SQS')
  })

  test('recognizes kinesis data stream event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: kinesisDataStreamEvent })
    expect(result).toEqual('AWS_KINESIS_DATA_STREAM')
  })

  test('recognises self managed kafka event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: selfManagedKafkaEvent })
    expect(result).toEqual('AWS_SELF_MANAGED_KAFKA')
  })

  test('recognizes eventbridge event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: eventbridgeEvent })
    expect(result).toEqual('AWS_EVENTBRIDGE')
  })

  test('recognizes eventbridge scheduled event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: eventbridgeScheduledEvent })
    expect(result).toEqual('AWS_EVENTBRIDGE')
  })

  test('recognizes eventbridge customer event', () => {
    const result = getEventSourceNameBasedOnEvent({ event: eventbridgeCustomerEvent })
    expect(result).toEqual('AWS_EVENTBRIDGE')
  })
})

module.exports = {
  samHttpApiEvent,
  dynamoDbEvent,
  snsEvent,
  sqsEvent,
  eventbridgeEvent,
  eventbridgeScheduledEvent,
  eventbridgeCustomerEvent,
  kinesisDataStreamEvent,
  selfManagedKafkaEvent
}
