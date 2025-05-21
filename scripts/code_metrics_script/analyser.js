const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

function tryParseWithPlugins(code, plugins) {
    try {
        return parser.parse(code, {
            sourceType: "module",
            plugins
        });
    } catch (e) {
        return { error: e };
    }
}

function analyzeTestFunctionWithBabel(testCode) {
    let ast;
    // Try TypeScript first
    let result = tryParseWithPlugins(testCode, [
        "jsx",
        "typescript",
        "classProperties",
        "objectRestSpread",
        "optionalChaining",
        "nullishCoalescingOperator",
        "decorators-legacy",
        "dynamicImport"
    ]);
    if (result.error) {
        // If error is about TS/Flow, try Flow
        result = tryParseWithPlugins(testCode, [
            "jsx",
            "flow",
            "classProperties",
            "objectRestSpread",
            "optionalChaining",
            "nullishCoalescingOperator",
            "decorators-legacy",
            "dynamicImport"
        ]);
        if (result.error) {
            const e = result.error;
            const line = e.loc ? e.loc.line : (e.lineNumber || 'unknown');
            return { error: `Parse error at line ${line}: ${e.message}` };
        }
    }
    ast = result;

    const metrics = {
        logicalSloc: 0,
        cyclomatic: 1,
        operators: new Set(),
        operands: new Set(),
        operatorCount: 0,
        operandCount: 0
    };

    traverse(ast, {
        enter(path) {
            const node = path.node;
            if (isStatementNode(node)) {
                metrics.logicalSloc++;
            }
            if (isDecisionPoint(node)) {
                metrics.cyclomatic++;
            }
            collectHalsteadMetrics(node, metrics);
        }
    });

    const halstead = calculateHalsteadFromMetrics(metrics);
    const cyclomaticDensity = metrics.logicalSloc > 0
        ? metrics.cyclomatic / metrics.logicalSloc * 100
        : 0;
    const maintainability = calculateMaintainabilityIndex(
        metrics.logicalSloc,
        metrics.cyclomatic,
        halstead.volume
    );

    return {
        SLOC_Logical: metrics.logicalSloc,
        Cyclomatic: metrics.cyclomatic,
        CyclomaticDensity: cyclomaticDensity,
        Halstead_Effort: halstead.effort,
        Halstead_Bugs: halstead.bugs,
        Maintainability: maintainability
    };
}

// Helper functions

function isStatementNode(node) {
    const statementTypes = new Set([
        'ExpressionStatement',
        'VariableDeclaration',
        'IfStatement',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'WhileStatement',
        'DoWhileStatement',
        'SwitchStatement',
        'TryStatement',
        'ThrowStatement',
        'ReturnStatement',
        'BreakStatement',
        'ContinueStatement',
        'BlockStatement'
    ]);
    return statementTypes.has(node.type);
}

function isDecisionPoint(node) {
    const decisionTypes = new Set([
        'IfStatement',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'WhileStatement',
        'DoWhileStatement',
        'SwitchCase',
        'CatchClause',
        'ConditionalExpression',
        'LogicalExpression'
    ]);
    return decisionTypes.has(node.type);
}

function collectHalsteadMetrics(node, metrics) {
    switch (node.type) {
        case 'BinaryExpression':
        case 'LogicalExpression':
        case 'UnaryExpression':
        case 'AssignmentExpression':
        case 'UpdateExpression':
            metrics.operators.add(node.operator);
            metrics.operatorCount++;
            break;
        case 'Identifier':
            metrics.operands.add(node.name);
            metrics.operandCount++;
            break;
        case 'Literal':
        case 'StringLiteral':
        case 'NumericLiteral':
            if (typeof node.value === 'string' || typeof node.value === 'number') {
                metrics.operands.add(String(node.value));
                metrics.operandCount++;
            }
            break;
        case 'CallExpression':
            metrics.operators.add('()');
            metrics.operatorCount++;
            break;
        case 'MemberExpression':
            metrics.operators.add('.');
            metrics.operatorCount++;
            break;
    }
}

function calculateHalsteadFromMetrics(metrics) {
    const distinctOperators = metrics.operators.size;
    const distinctOperands = metrics.operands.size;
    const totalOperators = metrics.operatorCount;
    const totalOperands = metrics.operandCount;

    const vocabulary = distinctOperators + distinctOperands;
    const length = totalOperators + totalOperands;
    const volume = length * Math.log2(vocabulary || 1);
    const difficulty = (distinctOperators / 2) * (totalOperands / (distinctOperands || 1));
    const effort = difficulty * volume;
    const bugs = Math.pow(volume, 2/3) / 3000;

    return {
        effort,
        bugs,
        volume
    };
}

function calculateMaintainabilityIndex(logicalSloc, cyclomatic, halsteadVolume) {
    const normalizedVolume = Math.log(halsteadVolume || 1);
    const normalizedComplexity = Math.log(cyclomatic || 1);
    const normalizedSloc = Math.log(logicalSloc || 1);

    const maintainability = 171 - 5.2 * normalizedVolume - 0.23 * normalizedComplexity - 16.2 * normalizedSloc;
    return Math.max(0, Math.min(100, maintainability));
}

// Update the path to your dataset as needed:
// const filePath = '/home/username/Desktop/refactoring-smells/scripts/assets/Refactor - Dataset_Whisperer.csv';
const filePath = '/home/username/Desktop/refactoring-smells/scripts/assets/Refactor - Dataset_Copilot.csv';

if (!fs.existsSync(filePath)) {
    console.error('Input CSV file not found at:', filePath);
    process.exit(1);
}

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) throw err;

    parse(data, { columns: true, trim: true }, async (err, records) => {
        if (err) throw err;

        const outputRows = [];
        let number = 1;

        for (const row of records) {
            const original = row['Original Method'];
            const refactored = row['Refactored Method'];

            const origMetrics = analyzeTestFunctionWithBabel(original) || {};
            const refacMetrics = analyzeTestFunctionWithBabel(refactored) || {};

            const origMetricValues = origMetrics.error
                ? Array(6).fill(origMetrics.error)
                : Object.values(origMetrics);
            const refacMetricValues = refacMetrics.error
                ? Array(6).fill(refacMetrics.error)
                : Object.values(refacMetrics);

            outputRows.push([
                number,
                original.replace(/\n/g, '\\n'),
                ...origMetricValues,
                refactored.replace(/\n/g, '\\n'),
                ...refacMetricValues
            ]);
            number++;
        }

        const metricKeys = [
            'SLOC_Logical',
            'Cyclomatic',
            'CyclomaticDensity',
            'Halstead_Effort',
            'Halstead_Bugs',
            'Maintainability'
        ];
        const header = [
            'number',
            'original_method',
            ...metricKeys,
            'refactored_method',
            ...metricKeys
        ];

        stringify([header, ...outputRows], (err, output) => {
            if (err) throw err;
            fs.writeFileSync('output.csv', output, 'utf8');
            console.log('output.csv written');
        });
    });
});