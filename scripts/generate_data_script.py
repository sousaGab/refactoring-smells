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

def log_info(message):
    """Log informational messages."""
    print(f"[INFO] {message}")

def log_error(message):
    """Log error messages."""
    print(f"[ERROR] {message}")

def validate_env_variable(var_name):
    """Validate that an environment variable is set."""
    value = os.getenv(var_name, '')
    if not value:
        raise ValueError(f"Environment variable '{var_name}' is not set.")
    return value

def run_steel_tool(project_name, llm):
    """Run the steel detection tool."""
    smell_detections_tools_path = validate_env_variable('STEEL_DETECTION_TOOL_PATH')
    os.chdir(smell_detections_tools_path)
    log_info(f"Changed directory to {os.getcwd()}")

    test_files_pattern = "{**/__tests__/**/*.js,**/test/**/*.js,**/?(*.)+(test|tests|spec|specs).js,**/test_*.js,**/test-*.js,**/Spec*.js,**/*Test.js,**/*Tests.js}"
    steel_command = f'npx steel detect "../../projects/{project_name}/**/{test_files_pattern}"'

    log_info(f"Running command: {steel_command}")
    subprocess.run(steel_command, shell=True, check=True)

def process_steel_json_to_csv(smell_number, llm):
    """Process the steel JSON file and convert it to a CSV."""

    input_file = validate_env_variable('INPUT_STEEL_JSON')
    output_file = f'/home/gabriel/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/steel.csv'

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


async def run_snuts_js(project_name, smell_number, llm):
    """Run the Snuts.js tool."""
    projects_folder = validate_env_variable('PROJECTS_FOLDER')
    snuts_output_folder = f'/home/gabriel/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/snutsjs.csv'

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


def concat_csv(name_run, smell_number, llm):
    """Concatenate the steel and Snuts.js CSV files."""
    #string_csv_input_1
    steel_csv = f'/home/gabriel/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/steel.csv'
    snutsjs_csv = f'/home/gabriel/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/snutsjs.csv'


    #read the steel csv file
    steel_df = pd.read_csv(steel_csv)

    #read the snutsjs csv file
    snutsjs_df = pd.read_csv(snutsjs_csv)
    
    #concatenate the two dataframes
    combined_df = pd.concat([steel_df, snutsjs_df], ignore_index=True)
    #save the combined dataframe to a new csv file
    combined_df.to_csv(f'/home/gabriel/Desktop/research/refactoring_data/copilot/smell_{smell_number}/{name_run}_smells.csv', index=False)
    log_info(f"Combined CSV file created successfully at: /home/gabriel/Desktop/research/refactoring_data/copilot/smell_{smell_number}/{name_run}_smells.csv")


def organize_output_folder(smell_number, llm):
    """Organize the output folder."""
    # Delete csv files
    csv_files = [
        f'/home/gabriel/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/steel.csv',
        f'/home/gabriel/Desktop/research/refactoring_data/{llm}/smell_{smell_number}/snutsjs.csv'
    ]

    for csv_file in csv_files:
        if os.path.exists(csv_file):
            os.remove(csv_file)
            log_info(f"Deleted file: {csv_file}")
        else:
            log_info(f"File not found, skipping deletion: {csv_file}")    

async def main():

    llm = 'copilot'

    projects_names = {
        1: 'vanilla-lazyload',
        2: 'ncc',
        3: 'binance-trading-bot',
        4: 'prettier',
        5: 'react-beautiful-dnd',
        6: 'intl-tel-input',
        7: 'miragejs',
        8: 'surfingkeys',
        9: 'tether',
        10: 'katex'
    }

    type_of_run = input("Enter the type of run (1 for original, 2 for refactored): ").strip()

    #print projects
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
        # Steel tool process
        log_info("Starting the steel tool process...")
        run_steel_tool(project_name,llm)
        log_info("Steel tool process completed.")

        log_info("Processing the steel JSON to CSV...")
        process_steel_json_to_csv(smell_number, llm)
        log_info("Steel JSON to CSV processing completed.")

        # Snuts.js process
        log_info("Starting the Snuts.js process...")
        await run_snuts_js(project_name, smell_number, llm)
        log_info("Snuts.js process completed.")

        # Concatenate CSV files
        log_info("Starting the CSV concatenation process...")
        concat_csv(name_run,smell_number,llm)
        log_info("CSV files concatenation completed.")

        # Organize the output folder
        log_info("Organizing the output folder...")
        organize_output_folder(smell_number, llm)
        log_info("Output folder organization completed.")



    except subprocess.CalledProcessError as e:
        log_error(f"An error occurred while running a command: {e}")
    except Exception as e:
        log_error(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())