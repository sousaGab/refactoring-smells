const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run Jest with coverage and JSON output
exec('cross-env  NODE_ENV=test jest --coverage --detectOpenHandles --coverageReporters=json-summary --json --outputFile=output_tests', (error, stdout, stderr) => { 
    if (error) {
        console.error(`Error running tests: ${error.message}`);
        return;
    }

    // Parse test results from output_tests
    const testResultsPath = path.join(__dirname, 'output_tests');
    const coverageSummaryPath = path.join(__dirname, 'coverage/coverage-summary.json');

    if (fs.existsSync(testResultsPath) && fs.existsSync(coverageSummaryPath)) {
        const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
        const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));

        // Extract test results
        const totalRuntime = testResults.testResults
            ? testResults.testResults.reduce((acc, result) => acc + (result.perfStats?.runtime || 0), 0) / 1000
            : 0;

        const testSummary = `
Test Suites: ${testResults.numPassedTestSuites || 0} passed, ${testResults.numTotalTestSuites || 0} total
Tests:       ${testResults.numPassedTests || 0} passed, ${testResults.numTotalTests || 0} total
Snapshots:   ${testResults.snapshot?.total || 0} total
Time:        ${totalRuntime.toFixed(2)}s
Ran all test suites.
`;

        // Extract coverage summary
        const coverage = coverageSummary.total;
        const coverageSummaryText = `
Total Coverage:
Statements: ${coverage.statements.pct || 0}%
Branches: ${coverage.branches.pct || 0}%
Functions: ${coverage.functions.pct || 0}%
Lines: ${coverage.lines.pct || 0}%
`;

        // Combine and write to a file
        const finalSummary = testSummary + coverageSummaryText;
        fs.writeFileSync(path.join(__dirname, 'test_summary.txt'), finalSummary);

        console.log('Test summary written to test_summary.txt');
    } else {
        console.error('Test results or coverage summary not found. Make sure Jest ran successfully.');
    }
});