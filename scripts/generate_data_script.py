import os
import subprocess
import json
import shutil
import csv
import asyncio
import pandas as pd
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Logging utilities
def log_info(message):
    """Log informational messages."""
    print(f"[INFO] {message}")

def log_error(message):
    """Log error messages."""
    print(f"[ERROR] {message}")

# Environment variable utilities
def validate_env_variable(var_name):
    """Validate that an environment variable is set."""
    value = os.getenv(var_name, '')
    if not value:
        raise ValueError(f"Environment variable '{var_name}' is not set.")
    return value

# Steel tool utilities
def run_steel_tool(project_name, llm):
    """Run the steel detection tool."""
    smell_detections_tools_path = validate_env_variable('STEEL_DETECTION_TOOL_PATH')
    os.chdir(smell_detections_tools_path)
    log_info(f"Changed directory to {os.getcwd()}")

    test_files_pattern = "{**/__tests__/**/*.js,**/test/**/*.js,**/?(*.)+(test|tests|spec|specs).js,**/test_*.js,**/test-*.js,**/Spec*.js,**/*Test.js,**/*Tests.js}"
    
    if project_name == 'prettier':
        test_files_pattern = "{*.test.js,*.tests.js,*.spec.js,*.specs.js,test_*.js,test-*.js,Spec*.js}"
    
    steel_command = f'npx steel detect "../../projects/{project_name}/**/{test_files_pattern}"'

    log_info(f"Running command: {steel_command}")
    subprocess.run(steel_command, shell=True, check=True)

def process_steel_json_to_csv(smell_number, llm):
    """Process the steel JSON file and convert it to a CSV."""
    input_file = validate_env_variable('INPUT_STEEL_JSON')
    output_file = f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/steel.csv'

    with open(input_file, 'r') as json_file:
        data = json.load(json_file)

    smelled_files = data.get('smelledFiles', [])
    csv_data = []

    for smelled_file in smelled_files:
        file_name = smelled_file.get('path', 'Unknown')
        smelled_info = smelled_file.get('smellInfo', [])

        for smelled_info_item in smelled_info:
            smell_type = smelled_info_item.get('name', 'Unknown')
            items = smelled_info_item.get('items', [])

            for item in items:
                smell_lines = item.get('start', [])
                frame = item.get('frame', 'Unknown')
                csv_data.append([file_name, smell_type, smell_lines, frame])

    with open(output_file, 'w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(['file', 'type', 'smells', 'frame'])
        writer.writerows(csv_data)

    log_info(f"CSV file created successfully at: {output_file}")

# Snuts.js utilities
async def run_snuts_js(project_name, smell_number, llm):
    """Run the Snuts.js tool."""
    projects_folder = validate_env_variable('PROJECTS_FOLDER')
    snuts_output_folder = f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/snutsjs.csv'

    snuts_command = (
        f'curl -X POST http://localhost:3001/export-csv-local '
        f'-H "Content-Type: application/json" '
        f'-d \'{{"directory":"{projects_folder}{project_name}/"}}\' '
        f'-o {snuts_output_folder}'
    )

    log_info(f"Running command: {snuts_command}")
    process = await asyncio.create_subprocess_shell(
        snuts_command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()

    if process.returncode == 0:
        log_info(f"Snuts.js command completed successfully:\n{stdout.decode()}")
    else:
        log_error(f"Snuts.js command failed with error:\n{stderr.decode()}")
        raise subprocess.CalledProcessError(process.returncode, snuts_command)

# CSV utilities
def concat_csv(name_run, smell_number, llm):
    """Concatenate the steel and Snuts.js CSV files."""
    steel_csv = f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/steel.csv'
    snutsjs_csv = f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/snutsjs.csv'

    steel_df = pd.read_csv(steel_csv)
    snutsjs_df = pd.read_csv(snutsjs_csv)

    combined_df = pd.concat([steel_df, snutsjs_df], ignore_index=True)
    output_file = f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/{name_run}_smells.csv'
    combined_df.to_csv(output_file, index=False)

    log_info(f"Combined CSV file created successfully at: {output_file}")

# File organization utilities
def organize_output_folder(smell_number, llm):
    """Organize the output folder."""
    csv_files = [
        f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/steel.csv',
        f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/snutsjs.csv'
    ]

    for csv_file in csv_files:
        if os.path.exists(csv_file):
            os.remove(csv_file)
            log_info(f"Deleted file: {csv_file}")
        else:
            log_info(f"File not found, skipping deletion: {csv_file}")

def copy_test_file(name_run, project_name, smell_number, llm):
    """Copy the test file to the output folder and delete the original test_summary.txt and output_tests files."""
    csv_file_path = f'/home/username/Desktop/research/scripts/assets/dataset.csv'
    df = pd.read_csv(csv_file_path)

    filtered_df = df.loc[df['Id'] == int(smell_number), 'File']
    if filtered_df.empty:
        log_error(f"No entry found for smell_number: {smell_number}")
        return

    test_file_path = filtered_df.values[0]
    source_file = f'/home/username/Desktop/research/projects/{project_name}{test_file_path}'
    destination_folder = f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/'
    new_file_name = f'{name_run}_test.js'

    try:
        if os.path.exists(source_file):
            destination_file = os.path.join(destination_folder, new_file_name)
            shutil.copy(source_file, destination_file)
            log_info(f"Copied test file to: {destination_folder}")
        else:
            project_folder = f'/home/username/Desktop/projects/{project_name}/'
            source_file = os.path.join(project_folder, test_file_path)
            log_info(f"Checking for test file in project folder: {source_file}")

    except FileNotFoundError:
        log_error(f"Test file not found: {source_file}")
    except Exception as e:
        log_error(f"An error occurred while copying the test file: {e}")

def run_tests(name_run, project_name, smell_number, llm):
    """Run the tests for the specified project."""
    test_command = f'npm run test:research'

    os.chdir(f'/home/username/Desktop/research/projects/{project_name}')
    log_info(f"Changed directory to {os.getcwd()}")

    log_info(f"Running command: {test_command}")
    subprocess.run(test_command, shell=True, check=True)

    log_info("Tests completed successfully.")

    # Copy the test_summary.txt to the output folder
    test_summary_file = f'/home/username/Desktop/research/projects/{project_name}/test_summary.txt'
    destination_folder = f'/home/username/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/'
    destination_file = os.path.join(destination_folder, f'{name_run}_test_summary.txt')
    try:
        if os.path.exists(test_summary_file):
            shutil.copy(test_summary_file, destination_file)
            log_info(f"Copied test summary file to: {destination_folder}")
              # Delete the original test_summary.txt file
            test_summary_file = f'/home/username/Desktop/research/projects/{project_name}/test_summary.txt'
            if os.path.exists(test_summary_file):
                os.remove(test_summary_file)
                log_info(f"Deleted original test_summary.txt file: {test_summary_file}")
            else:
                log_info(f"Original test_summary.txt file not found, skipping deletion: {test_summary_file}")

            # Delete the output_tests file
            output_tests_file = f'/home/username/Desktop/research/projects/{project_name}/output_tests'
            if os.path.exists(output_tests_file):
                os.remove(output_tests_file)
                log_info(f"Deleted output_tests file: {output_tests_file}")
            else:
                log_info(f"Output_tests file not found, skipping deletion: {output_tests_file}")

        else:
            log_error(f"Test summary file not found: {test_summary_file}")
    except FileNotFoundError:
        log_error(f"Test summary file not found: {test_summary_file}")
    except Exception as e:
        log_error(f"An error occurred while copying the test summary file: {e}")


# Main function
async def main():
    # llm = 'copilot'
    llm = 'whisper'
    
    projects_names = {
        1: 'vanilla-lazyload',
        2: 'binance-trading-bot',
        3: 'prettier',
        4: 'react-beautiful-dnd',
        5: 'intl-tel-input',
        6: 'miragejs',
        7: 'surfingkeys',
        8: 'tether',
        9: 'katex',
        10: 'serverless-express',
        # 10: 'ncc'
    }

    type_of_run = input("Enter the type of run (1 for original, 2 for refactored): ").strip()
    print("Available projects:")
    for key, value in projects_names.items():
        print(f"{key}: {value}")
    project_number = input("Enter the project number (1-10): ").strip()

    project_name = projects_names.get(int(project_number))
    smell_number = input("Enter the smell number: ").strip()
    if type_of_run not in ['1', '2']:
        log_error("Invalid input. Please enter 1 or 2.")
        return
    name_run = 'original' if type_of_run == '1' else 'refactored'

    try:
        log_info("Starting the steel tool process...")
        run_steel_tool(project_name, llm)
        log_info("Steel tool process completed.")

        log_info("Processing the steel JSON to CSV...")
        process_steel_json_to_csv(smell_number, llm)
        log_info("Steel JSON to CSV processing completed.")

        log_info("Starting the Snuts.js process...")
        await run_snuts_js(project_name, smell_number, llm)
        log_info("Snuts.js process completed.")

        log_info("Starting the CSV concatenation process...")
        concat_csv(name_run, smell_number, llm)
        log_info("CSV files concatenation completed.")

        log_info("Organizing the output folder...")
        organize_output_folder(smell_number, llm)
        log_info("Output folder organization completed.")

        log_info("Copying the test file...")
        copy_test_file(name_run, project_name, smell_number, llm)
        log_info("Test file copied successfully.")

        # log_info("Running the tests...")
        # run_tests(name_run, project_name, smell_number, llm)
        # log_info("Tests run completed.")


    except subprocess.CalledProcessError as e:
        log_error(f"An error occurred while running a command: {e}")
    except Exception as e:
        log_error(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())