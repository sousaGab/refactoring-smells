# Research Scripts Guide

This repository contains a collection of Python scripts designed to assist with various research tasks, including analyzing JavaScript repositories, detecting test smells, and processing data. Each script is explained in detail below, along with instructions on how to run and use them.

---

## Table of Contents
- [Scripts Overview](#scripts-overview)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Scripts Details](#scripts-details)
  - [1. `filter_script.py`](#1-filter_scriptpy)
  - [2. `run_steel.py`](#2-run_steelpy)
  - [3. `run_snutsjs.py`](#3-run_snutsjspy)
  - [4. `random_script.py`](#4-random_scriptpy)
- [Common Issues](#common-issues)
- [License](#license)

---

## Scripts Overview

| Script Name         | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `filter_script.py`   | Analyzes GitHub repositories for JavaScript usage, test frameworks, and licenses. |
| `run_steel.py`       | Runs the Steel detection tool to identify test smells in JavaScript files.  |
| `run_snutsjs.py`     | Runs the Snuts.js tool to detect test smells and filters the results.       |
| `random_script.py`   | Randomly selects repositories from a CSV file for further analysis.         |

---

## Setup

### Prerequisites
1. **Python 3.8 or higher**:
   - Install required Python libraries:
     ```bash
     pip install pandas python-dotenv requests
     ```

2. **Node.js (for Steel and Snuts.js)**:
   - Install Node.js from [Node.js Official Website](https://nodejs.org/).

3. **Environment Variables**:
   - Create a `.env` file in the root directory to store environment variables (see [Environment Variables](#environment-variables)).

---

## Environment Variables

The following environment variables are used across the scripts. Add them to your `.env` file:

| Variable Name                | Description                                                                 |
|-------------------------------|-----------------------------------------------------------------------------|
| `GITHUB_TOKEN`               | Your GitHub personal access token for API requests.                        |
| `PROJECTS_FOLDER`            | Path to the folder containing JavaScript projects.                         |
| `OUTPUT_SNUTS_FOLDER`        | Path to store Snuts.js output files.                                        |
| `INPUT_STEEL_JSON`           | Path to the Steel JSON file.                                                |
| `OUTPUT_STEEL_CSV`           | Path to store the Steel CSV output.                                         |
| `INPUT_FILE`                 | Path to the input CSV file for random selection.                           |
| `OUTPUT_FILE`                | Path to the output CSV file for random selection.                          |

---

## Scripts Details

### 1. `filter_script.py`

#### Description
This script analyzes GitHub repositories to determine:
- The percentage of JavaScript code.
- The test framework used (e.g., Jest, Mocha).
- The license type.

#### How to Run
```bash
python filter_script.py
```

#### Input
- A CSV file named `repo_list_initial.csv` containing repository names.

#### Output
- A CSV file named `output_classification.csv` with the following columns:
  - `Name`: Repository name.
  - `JavaScript Percentage`: Percentage of JavaScript code.
  - `Test Framework`: Detected test framework.
  - `License`: License type.

---

### 2. `run_steel.py`

#### Description
This script runs the Steel detection tool to identify test smells in JavaScript files and processes the results into a CSV file.

#### How to Run
```bash
python run_steel.py
```

#### Steps
1. Prompts for the project name.
2. Runs the Steel detection tool.
3. Processes the Steel JSON output into a CSV file.

#### Output
- A CSV file with the following columns:
  - `file`: File path.
  - `type`: Type of test smell.
  - `smells`: Lines where the smell occurs.
  - `frame`: Additional context.

---

### 3. `run_snutsjs.py`

#### Description
This script runs the Snuts.js tool to detect test smells in JavaScript files and filters the results based on selected smell types.

#### How to Run
```bash
python run_snutsjs.py
```

#### Steps
1. Prompts for the project name.
2. Runs the Snuts.js tool.
3. Filters the Snuts.js CSV output based on selected smell types.

#### Output
- A filtered CSV file with test smell information.

---

### 4. `random_script.py`

#### Description
This script randomly selects repositories from a CSV file and saves the selected repositories to a new CSV file.

#### How to Run
```bash
python random_script.py
```

#### Input
- A CSV file specified by the `INPUT_FILE` environment variable.

#### Output
- A CSV file specified by the `OUTPUT_FILE` environment variable containing randomly selected repositories.

---

## Common Issues

1. **Missing Environment Variables**:
   - Ensure all required environment variables are set in the `.env` file.

2. **Invalid Input Files**:
   - Verify that input CSV files are correctly formatted.

3. **GitHub API Rate Limits**:
   - If you encounter rate limits, ensure your `GITHUB_TOKEN` has sufficient permissions and try again later.

4. **Steel or Snuts.js Errors**:
   - Ensure the Steel and Snuts.js tools are installed and configured correctly.

---
