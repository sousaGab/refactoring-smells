const detectors = require('./detectors');
const { astAnalyzer } = require('./astAnalyzer');
const { readFileSync, writeFileSync, appendFileSync } = require('fs');
const testInfo = require('./helpers/testInfo');
const log = (message) => appendFileSync('error.log', `\n${message}`);

const JSTestSmellsDetector = (inputCsv, outputCsv) => {
    console.log('Detecting specific test smells...');
    const inputCsvFile = readFileSync(inputCsv, 'utf8');
    const files = inputCsvFile.split(/\r?\n/).filter(file => file);

    if (outputCsv) {
        const csvString = exportToCsv(files);
        writeFileSync(outputCsv, csvString);
        console.log('Done detecting specific test smells');
    }
};

const DEFAULT_FILE_ENCODING = 'utf8';

const getAstsFromFile = (row) => {
    const [file, ...additionalFiles] = row.split(',');
    const code = readFileSync(file, DEFAULT_FILE_ENCODING);
    const testAst = astAnalyzer.getAst(code);
    testAst.program.sourceFile = file;
    const additionalFilesAst = additionalFiles.filter(file => file).map(file => {
        const code = readFileSync(file, DEFAULT_FILE_ENCODING);
        return astAnalyzer.getAst(code);
    });
    return { testAst, additionalFilesAst };
}


const exportToCsv = (files) => {
    const headers = ['file', 'describeCount', 'itCount', 'complexSnapshots', 'identicalTestDescription',
        'nonFunctionalStatement', 'onlyTest', 'subOptimalAssert', 'unusedImports',
        'verboseTest', 'verifyInSetup'];

    const csv = [headers];
    csv[0] = headers.join(',');
    files.forEach(file => {
        const [testFile] = file.split(',');
        const row = [testFile];
        console.log(`Analyse testfile: ${testFile}`);
        try {
            const ast = getAstsFromFile(testFile);
            console.log(`Analyzing ast: ${ast}`);
            const infos = testInfo(ast.testAst);
            row.push(infos.describeCount);
            row.push(infos.itCount);
            analyzeFile(ast).forEach(smell => {
                row.push(smell.smells.length);
            });
        } catch (e) {
            console.log(`Error analyzing file: ${testFile}`);
            console.log(e.message);
            console.log(e.stack);
        }
        csv.push(row.join(','));
    });
    return csv.join('\r\n');
}

const analyzeFile = ({ testAst, additionalFilesAst }) => {
    const result = detectors.map(smell => ({
        type: smell.type,
        smells: smell.detector(testAst, additionalFilesAst)
    }));
    return result
}

const init = () => {
    const [inputCsv, outputCsv] = process.argv.slice(2);

    if (inputCsv && outputCsv) {
        JSTestSmellsDetector(inputCsv.replace(/-input=/, ''), outputCsv.replace(/-output=/, ''));
    } else {
        console.log('Usage: node index.js -input=<csv file with test files> -output=<csv file with test smells>');
    };
}

init()
