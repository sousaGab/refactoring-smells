# Method Script

This repository contains the scripts method_script.js designed to process a CSV file, extract test methods from JavaScript files, and output the results to another CSV file. These scripts are useful for analyzing test files and identifying specific test methods based on line numbers.

---

## Table of Contents
- Requirements
- Setup
- Usage
  - JavaScript Script
- Environment Variables
- Input CSV Format
- Output CSV Format
- Debugging

---

## Requirements

### JavaScript Script
- Node.js 14 or higher
- Required Node.js libraries:
  - `@babel/parser`
  - `@babel/traverse`
  - `csv-parser`
  - `csv-stringify`

---

## Setup

### JavaScript Script
1. Install Node.js from [Node.js Official Website](https://nodejs.org/).

2. Install the required Node.js libraries:
   ```bash
   npm install @babel/parser @babel/traverse csv-parser csv-stringify
   ```

3. Clone the repository or copy the method_script.js file to your working directory.

---

## Usage

### JavaScript Script
1. Run the script using the following command:
   ```bash
   node method_script.js <input_csv> <output_csv>
   ```

2. Example:
   ```bash
   node method_script.js input.csv output.csv
   ```

---

## Environment Variables

### `PROJECT_PATH`
Both scripts use the `PROJECT_PATH` environment variable to locate the base directory for JavaScript projects. If the variable is not set, the scripts will fall back to the default path projects.

1. To set the environment variable temporarily:
   ```bash
   export PROJECT_PATH="/path/to/your/projects"
   ```

2. To make it permanent, add the following line to your shell configuration file (e.g., `.bashrc` or `.zshrc`):
   ```bash
   export PROJECT_PATH="/path/to/your/projects"
   ```

---

## Input CSV Format

The input CSV file should have the following columns:

| Column Name       | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `Repository`       | The repository name or path (e.g., `atlassian/react-beautiful-dnd`).       |
| `File`             | The relative path to the JavaScript file (e.g., `/tests/unit/test.js`).    |
| `Lines`            | A JSON-like string specifying the target line (e.g., `{'line': 68}`).     |

### Example Input CSV
```csv
Repository,File,Lines
atlassian/react-beautiful-dnd,/tests/unit/test.js,"{'line': 68}"
verlok/vanilla-lazyload,/tests/unit/cancelOnExit.test.js,"{'line': 42}"
```

---

## Output CSV Format

The output CSV file will have the following columns:

| Column Name              | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| `A (filename)`           | The full path to the JavaScript file.                                       |
| `B (test)`               | The extracted test method or an error message.                             |
| `C (start: ... end: ....)`| The start and end line numbers of the extracted test method.               |

### Example Output CSV
```csv
A (filename),B (test),C (start: ... end: ....)
"/path/to/project/tests/unit/test.js","it('should do something', () => { ... });","start: 10 end: 20"
"/path/to/project/tests/unit/cancelOnExit.test.js","Error: No test method found containing the specified line.",""
```

---

## Debugging

### JavaScript Script
- Debug statements are printed to the console to help identify issues with parsing or file paths.
- Example:
  ```bash
  Debug: Processing row: { Repository: 'atlassian/react-beautiful-dnd', File: '/tests/unit/test.js', Lines: "{'line': 68}" }
  Debug: Error processing row: Invalid "Lines" field format.
  ```

---

## Notes
- Ensure that the `Lines` field in the input CSV is properly formatted as a JSON-like string (e.g., `{'line': 68}`).
- If you encounter issues with parsing JavaScript files, ensure that the files are valid and do not contain unsupported syntax.

---
