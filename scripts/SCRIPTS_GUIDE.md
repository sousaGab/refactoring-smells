# Research Scripts Guide

This repository contains a suite of scripts for analyzing JavaScript repositories, detecting test smells, collecting code metrics, and processing research data.  
**Please follow the setup instructions carefully before running any script.**

---

## Table of Contents

| Section                        | Description                                                                                 |
|---------------------------------|---------------------------------------------------------------------------------------------|
| [Setup](#setup)                | Prerequisites and environment configuration                                                 |
| [Environment Variables](#environment-variables) | How to configure your `.env` file and what each variable means                  |
| [Scripts Overview](#scripts-overview)           | Quick summary of all scripts and their purposes                                 |
| [Scripts Details](#scripts-details)             | Detailed usage and description for each script                                   |
| [Common Issues](#common-issues)                 | Troubleshooting and tips                                                         |
| [License](#license)                             | License information                                                              |

---

## Setup

### Prerequisites

| Requirement         | Details                                                                                   |
|---------------------|-------------------------------------------------------------------------------------------|
| Python              | Version 3.8 or higher                                                                     |
| Node.js             | Required for Steel and Snuts.js tools (see [Node.js Official Website](https://nodejs.org/))|
| Python Libraries    | Install with:<br> <code>pip install pandas python-dotenv requests</code>                  |

### Environment Variables

1. **Copy the example file:**  
   ```bash
   cp scripts/env.example .env
   ```
2. **Edit `.env`:**  
   Fill in the required variables as described in the comments of `env.example`.  
   This file is required for all Python scripts.

---

## Environment Variables

| Variable Name         | Description                                                      |
|---------------------- |------------------------------------------------------------------|
| `GITHUB_TOKEN`        | GitHub personal access token for API requests                    |
| `PROJECTS_FOLDER`     | Path to the folder containing JavaScript projects                |
| `OUTPUT_SNUTS_FOLDER` | Path to store Snuts.js output files                              |
| `INPUT_STEEL_JSON`    | Path to the Steel JSON file                                      |
| `OUTPUT_STEEL_CSV`    | Path to store the Steel CSV output                               |
| `INPUT_FILE`          | Path to the input CSV file for random selection                  |
| `OUTPUT_FILE`         | Path to the output CSV file for random selection                 |
| ...                   | See `env.example` for additional variables used by some scripts  |

---

## Scripts Overview

| Script Name                | Description                                                                                   |
|----------------------------|-----------------------------------------------------------------------------------------------|
| `filter_script.py`         | Analyzes GitHub repositories for JS usage, test frameworks, and licenses                      |
| `run_steel.py`             | Runs Steel to detect test smells in JS files and processes results                            |
| `run_snutsjs.py`           | Runs Snuts.js to detect and filter test smells in JS files                                    |
| `random_script.py`         | Randomly selects repositories from a CSV                                                      |
| `generate_data_script.py`  | Automates running detection tools and organizes outputs for analysis                          |
| `check_smells.py`          | Compares original and refactored test files for presence/removal of test smells               |
| `code_metrics_script.js`   | (JavaScript) Computes code metrics for methods before/after refactoring                       |
| `method_scripts.py`        | Extracts and lists methods analyzed by each test smell detection tool                         |

---

## Scripts Details

### `filter_script.py`
| Purpose         | Analyze GitHub repositories for JavaScript usage, test frameworks, and license types. |
|-----------------|--------------------------------------------------------------------------------------|
| Input           | `repo_list_initial.csv` (list of repository names)                                   |
| Output          | `output_classification.csv` (columns: Name, JavaScript Percentage, Test Framework, License) |
| How to Run      | `python filter_script.py`                                                            |

---

### `run_steel.py`
| Purpose         | Run the Steel detection tool to identify test smells in JavaScript files.             |
|-----------------|--------------------------------------------------------------------------------------|
| Steps           | Prompts for project name, runs Steel, processes JSON output to CSV                   |
| Output          | CSV with columns: file, type, smells, frame                                          |
| How to Run      | `python run_steel.py`                                                                |

---

### `run_snutsjs.py`
| Purpose         | Run Snuts.js to detect and filter test smells in JavaScript files.                    |
|-----------------|--------------------------------------------------------------------------------------|
| Steps           | Prompts for project name, runs Snuts.js, filters output CSV by smell types           |
| Output          | Filtered CSV with test smell information                                             |
| How to Run      | `python run_snutsjs.py`                                                              |

---

### `random_script.py`
| Purpose         | Randomly select repositories from a CSV file for further analysis.                    |
|-----------------|--------------------------------------------------------------------------------------|
| Input           | CSV specified by `INPUT_FILE` in `.env`                                              |
| Output          | CSV specified by `OUTPUT_FILE` in `.env`                                             |
| How to Run      | `python random_script.py`                                                            |

---

### `generate_data_script.py`
| Purpose         | Automate running Steel and Snuts.js, organize outputs, and copy relevant files.       |
|-----------------|--------------------------------------------------------------------------------------|
| Steps           | Runs both detection tools, processes outputs, copies test files for analysis         |
| Output          | Organized output folders and CSVs                                                    |
| How to Run      | `python generate_data_script.py`                                                     |

---

### `check_smells.py`
| Purpose         | Compare original and refactored test files for presence/removal of test smells.       |
|-----------------|--------------------------------------------------------------------------------------|
| Steps           | Compares detection results, summarizes changes                                       |
| Output          | Summary CSV or report                                                                |
| How to Run      | `python check_smells.py`                                                             |

---

### `code_metrics_script.js`
| Purpose         | Compute code metrics for methods before and after refactoring (JavaScript).           |
|-----------------|--------------------------------------------------------------------------------------|
| Input           | CSV with method details (before/after refactoring)                                   |
| Output          | CSV with code metrics for each method                                                |
| How to Run      | `node code_metrics_script.js`                                                        |

---

### `method_scripts.py`
| Purpose         | Extract and list methods analyzed by each test smell detection tool.                  |
|-----------------|--------------------------------------------------------------------------------------|
| Output          | CSV or report listing methods per tool                                               |
| How to Run      | `python method_scripts.py`                                                           |

---

## Common Issues

| Issue                        | Solution                                                                 |
|------------------------------|--------------------------------------------------------------------------|
| Missing environment variables| Ensure all required variables are set in `.env`                          |
| Invalid input files          | Verify input CSV files are correctly formatted                           |
| GitHub API rate limits       | Use a valid `GITHUB_TOKEN` and try again later                           |
| Steel/Snuts.js errors        | Ensure both tools are installed and configured correctly                 |
| Snuts.js                     | It was necessary for Snuts.js to be running for their scripts to work.  |


---

## License

See [LICENSE](../LICENSE) for details.

---