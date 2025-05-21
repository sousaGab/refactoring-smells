const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { stringify } = require('csv-stringify/sync');

/**
 * Constructs the file path and extracts the target line from the CSV row.
 * @param {object} row - A row from the CSV file.
 * @returns {object} - An object containing the file path and target line.
 */
function constructFilePathAndLine(row) {
  try {
    console.log('Debug: Processing row:', row);

    // Validate Repository and File fields
    if (!row['Repository'] || !row['File']) {
      throw new Error('Missing "Repository" or "File" field in the row.');
    }

    const repoName = row['Repository'].split('/').pop();

    // Use the PROJECT_PATH environment variable or fall back to a default value
    const projectPath = process.env.PROJECT_PATH || '/home/username/Desktop/research/projects/';
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Invalid PROJECT_PATH: ${projectPath}`);
    }

    const filePath = path.join(projectPath, repoName, row['File']);

    // Validate and parse the Lines field
    if (!row['Lines']) {
      throw new Error('Missing "Lines" field in the row.');
    }

    const linesData = JSON.parse(row['Lines'].replace(/'/g, '"'));
    const targetLine = linesData.startLine || linesData.line;

    if (!targetLine || typeof targetLine !== 'number') {
      throw new Error('Invalid "Lines" field format.');
    }

    return { filePath, targetLine };
  } catch (error) {
    console.error('Debug: Error processing row:', error.message);
    return { filePath: null, targetLine: null };
  }
}

/**
 * Extracts the test method containing the target line from a JavaScript file.
 * @param {string} filePath - Path to the JavaScript file.
 * @param {number} targetLine - Line number to locate the test method.
 * @returns {object} - Extracted test method or an error message.
 */
function findParentTestMethod(filePath, targetLine) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['flow', 'jsx'], // Enable Flow and JSX parsing
    });

    let result = { error: 'No test method found containing the specified line.' };

    traverse(ast, {
      CallExpression(path) {
        const { node } = path;

        // Check for test methods like `it`, `test`, `xit`, `fit`
        if (
          node.callee.type === 'Identifier' &&
          ['it', 'test', 'beforeEach', 'afterEach', 'xit', 'xdescribe', 'fdescribe'].includes(node.callee.name)
        ) {
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;

          if (startLine <= targetLine && targetLine <= endLine) {
            result = {
              test: code.split('\n').slice(startLine - 1, endLine).join('\n'),
              start: startLine,
              end: endLine,
            };
          }
        }

        // Check for `describe.only` or `describe.skip`
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'describe' &&
          ['only', 'skip'].includes(node.callee.property.name)
        ) {
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;

          if (startLine <= targetLine && targetLine <= endLine) {
            result = {
              test: code.split('\n').slice(startLine - 1, endLine).join('\n'),
              start: startLine,
              end: endLine,
            };
          }
        }
      },
    });

    return result;
  } catch (error) {
    return { error: `Failed to parse JavaScript file: ${error.message}` };
  }
}

/**
 * Processes the input CSV and writes results to the output CSV.
 * @param {string} inputCsv - Path to the input CSV file.
 * @param {string} outputCsv - Path to the output CSV file.
 */
function processCsv(inputCsv, outputCsv) {
  const rows = [];
  fs.createReadStream(inputCsv)
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('end', () => {
      const results = rows.map((row) => {
        const { filePath, targetLine } = constructFilePathAndLine(row);

        if (!filePath || !targetLine) {
          return {
            'filename': filePath || 'Invalid file path',
            'test': 'Error: Invalid "Lines" format',
            'start: ... end: ...': '',
          };
        }

        const result = findParentTestMethod(filePath, targetLine);
        if (result.error) {
          return {
            'filename': filePath,
            'test': result.error,
            'start: ... end: ...': '',
          };
        }

        return {
          'filename': filePath,
          'test': result.test,
          'start: ... end: ...': `start: ${result.start} end: ${result.end}`,
        };
      });

      const csvOutput = stringify(results, {
        header: true,
        columns: ['filename', 'test', 'start: ... end: ...'],
      });

      fs.writeFileSync(outputCsv, csvOutput);
      console.log(`Results written to ${outputCsv}`);
    })
    .on('error', (error) => {
      console.error(`Error reading input CSV: ${error.message}`);
    });
}

// Main script execution
if (require.main === module) {
  const inputCsv = process.argv[2];
  const outputCsv = process.argv[3];

  if (!inputCsv || !outputCsv) {
    console.error('Usage: node method_script.js <input_csv> <output_csv>');
    process.exit(1);
  }

  processCsv(inputCsv, outputCsv);
}