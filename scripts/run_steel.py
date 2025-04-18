import os
import subprocess
import json
import shutil
import csv
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

def run_steel_tool():
    """Run the steel detection tool."""
    smell_detections_tools_path = validate_env_variable('STEEL_DETECTION_TOOL_PATH')
    os.chdir(smell_detections_tools_path)
    log_info(f"Changed directory to {os.getcwd()}")

    project_name = input("Enter the project name: ").strip()
    # test_files_pattern = "{*.test.js,*.tests.js,*.spec.js,*.specs.js,test_*.js,test-*.js,Spec*.js}"
    # test_files_pattern = "{**/__tests__/**/*.js,*.test.js,*.tests.js,*.spec.js,*.specs.js,test_*.js,test-*.js,Spec*.js}"
    test_files_pattern = "{**/__tests__/**/*.js,**/test/**/*.js,**/?(*.)+(test|tests|spec|specs).js,**/test_*.js,**/test-*.js,**/Spec*.js,**/*Test.js,**/*Tests.js}"
    steel_command = f'npx steel detect "../../projects/{project_name}/**/{test_files_pattern}"'

    log_info(f"Running command: {steel_command}")
    subprocess.run(steel_command, shell=True, check=True)

def process_steel_json_to_csv():
    """Process the steel JSON file and convert it to a CSV."""
    selected_smell_types = os.getenv('SELECTED_STEEL_SMELL_TYPES', '')
    number_max_smells = 5

    input_file = validate_env_variable('INPUT_STEEL_JSON')
    output_file = validate_env_variable('OUTPUT_STEEL_CSV')

    with open(input_file, 'r') as json_file:
        data = json.load(json_file)

    smelled_files = data.get('smelledFiles', [])
    csv_data = []
    smell_type_counter = {}

    for smelled_file in smelled_files:
        file_name = smelled_file.get('path', 'Unknown')
        smelled_info = smelled_file.get('smellInfo', [])

        for smelled_info_item in smelled_info:
            smell_type = smelled_info_item.get('name', 'Unknown')

            if smell_type not in selected_smell_types:
                continue

            smell_type_counter.setdefault(smell_type, 0)

            if smell_type_counter[smell_type] >= number_max_smells:
                continue

            items = smelled_info_item.get('items', [])
            for item in items:
                smell_lines = item.get('start', [])
                frame = item.get('frame', 'Unknown')

                csv_data.append([file_name, smell_type, smell_lines, frame])
                smell_type_counter[smell_type] += 1

                if smell_type_counter[smell_type] >= number_max_smells:
                    break

    with open(output_file, 'w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(['file', 'type', 'smells', 'frame'])
        writer.writerows(csv_data)

    log_info(f"CSV file created successfully at: {output_file}")

def copy_steel_files():
    """Copy steel.html and steel.json files to the output folder."""
    input_html = validate_env_variable('INPUT_STEEL_HTML')
    input_json = validate_env_variable('INPUT_STEEL_JSON')
    output_csv = validate_env_variable('OUTPUT_STEEL_CSV')
    output_folder = os.path.dirname(output_csv)

    log_info(f"Input HTML Path: {input_html}")
    log_info(f"Input JSON Path: {input_json}")
    log_info(f"Output Folder: {output_folder}")

    os.makedirs(output_folder, exist_ok=True)
    log_info(f"Ensured output folder exists: {output_folder}")

    try:
        if os.path.exists(input_html):
            shutil.copy(input_html, output_folder)
            log_info(f"Copied {input_html} to {output_folder}")
        else:
            log_error(f"{input_html} does not exist.")
    except Exception as e:
        log_error(f"Failed to copy {input_html}. Error: {e}")

    try:
        if os.path.exists(input_json):
            shutil.copy(input_json, output_folder)
            log_info(f"Copied {input_json} to {output_folder}")
        else:
            log_error(f"{input_json} does not exist.")
    except Exception as e:
        log_error(f"Failed to copy {input_json}. Error: {e}")

if __name__ == "__main__":
    try:
        log_info("Starting the steel tool process...")
        run_steel_tool()
        log_info("Steel tool process completed.")

        log_info("Processing the steel JSON to CSV...")
        process_steel_json_to_csv()
        log_info("Steel JSON to CSV processing completed.")

        log_info("Copying steel.html and steel.json files...")
        copy_steel_files()
        log_info("Files copied successfully.")
    except subprocess.CalledProcessError as e:
        log_error(f"An error occurred while running a command: {e}")
    except Exception as e:
        log_error(f"An unexpected error occurred: {e}")