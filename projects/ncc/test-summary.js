const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to the Jest coverage and test result files
const coverageSummaryPath = path.join(__dirname, 'coverage', 'coverage-summary.json');
const testSummaryOutputPath = path.join(__dirname, 'test_summary.txt');

// Function to run Jest and capture its output
function getJestTestResults() {
    try {
        const jestOutput = execSync('npx jest --json --silent', { encoding: 'utf8' });
        return JSON.parse(jestOutput);
    } catch (error) {
        console.error('Error running Jest:', error.message);
        return null;
    }
}

// Function to read and parse the coverage summary JSON
function getCoverageSummary() {
    try {
        if (!fs.existsSync(coverageSummaryPath)) {
            console.error(`Coverage summary file not found at ${coverageSummaryPath}`);
            return null;
        }
        const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
        return {
            Statements: `${coverageData.total.statements.pct || 0}%`,
            Branches: `${coverageData.total.branches.pct || 0}%`,
            Functions: `${coverageData.total.functions.pct || 0}%`,
            Lines: `${coverageData.total.lines.pct || 0}%`,
        };
    } catch (error) {
        console.error('Error reading coverage summary:', error.message);
        return null;
    }
}

// Function to generate the test summary
function generateTestSummary() {
    const jestResults = getJestTestResults();
    const coverageSummary = getCoverageSummary();

    if (!jestResults || !jestResults.testResults) {
        console.error('Invalid Jest results data');
        return;
    }

    if (!coverageSummary) {
        console.error('Coverage summary data is missing');
        return;
    }

    const testSummary = [
        'Test Summary:',
        `Test Suites: ${jestResults.numPassedTestSuites || 0} passed, ${jestResults.numTotalTestSuites || 0} total`,
        `Tests:       ${jestResults.numPassedTests || 0} passed, ${jestResults.numTotalTests || 0} total`,
        `Snapshots:   ${jestResults.snapshot?.total || 0} total`,
        `Time:        ${(jestResults.testResults.reduce((acc, test) => acc + (test.perfStats?.runtime || 0), 0) / 1000).toFixed(2)}s`,
        '',
        'Total Coverage:',
        `Statements: ${coverageSummary.Statements}`,
        `Branches:   ${coverageSummary.Branches}`,
        `Functions:  ${coverageSummary.Functions}`,
        `Lines:      ${coverageSummary.Lines}`,
    ].join('\n');

    try {
        fs.writeFileSync(testSummaryOutputPath, testSummary, 'utf8');
        console.log('Test summary written to', testSummaryOutputPath);
    } catch (error) {
        console.error('Error writing test summary:', error.message);
    }
}

// Run the script
generateTestSummary();