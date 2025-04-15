import os
import subprocess
import json
import shutil
import csv
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def run_steel_tool():
    # Navigate to the smell-detections-tools folder
    smell_detections_tools_path = os.getenv('STEEL_DETECTION_TOOL_PATH', '')
    os.chdir(smell_detections_tools_path)
    print(f"Changed directory to {os.getcwd()}")

    # Get the project name
    project_name = input("Enter the project name: ")

    # Glob pattern for the test files
    test_files_pattern = "{*.test.js,*.tests.js,*.spec.js,*.specs.js,test_*.js,test-*.js,Spec*.js}"

    # Run the steel tool command
    steel_command = f'npx steel detect "../../projects/{project_name}/**/{test_files_pattern}"'

    print(f"Running command: {steel_command}")
    subprocess.run(steel_command, shell=True, check=True)

def process_steel_json_to_csv():

    selected_smell_types = os.getenv('SELECTED_STEEL_SMELL_TYPES', '')
    number_max_smells = 5

    # Define the input and output file paths
    input_file = os.getenv('INPUT_STEEL_JSON', '')
    output_file = os.getenv('OUTPUT_STEEL_CSV', '')
    if not input_file or not output_file:
        raise ValueError("Please set the INPUT_STEEL_JSON and OUTPUT_STEEL_CSV environment variables.")

    # Read the JSON file
    with open(input_file, 'r') as json_file:
        data = json.load(json_file)

    # Extract the smelledFiles array
    smelled_files = data.get('smelledFiles', [])

    # Prepare the data for the CSV
    csv_data = []
    smell_type_counter = {}  # Dictionary to count occurrences of each smell type

    for smelled_file in smelled_files:
        file_name = smelled_file.get('path', 'Unknown')
        smelled_info = smelled_file.get('smellInfo', [])

        for smelled_info_item in smelled_info:
            smell_type = smelled_info_item.get('name', 'Unknown')
            
            # Skip if the smell type is not in the selected types
            if smell_type not in selected_smell_types:
                continue

            # Initialize the counter for this smell type if not already present
            if smell_type not in smell_type_counter:
                smell_type_counter[smell_type] = 0

            # Skip adding rows if the counter for this smell type has reached the maximum
            if smell_type_counter[smell_type] >= number_max_smells:
                continue

            items = smelled_info_item.get('items', [])

            for item in items:
                smell_lines = item.get('start', [])
                frame = item.get('frame', 'Unknown')

                csv_data.append([file_name, smell_type, smell_lines, frame])

                # Increment the counter for this smell type
                smell_type_counter[smell_type] += 1

                # Stop processing further items for this smell type if the limit is reached
                if smell_type_counter[smell_type] >= number_max_smells:
                    break

    # Write the data to a CSV file
    with open(output_file, 'w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        # Write the header
        writer.writerow(['file', 'type', 'smells', 'frame'])
        # Write the rows
        writer.writerows(csv_data)

    print(f"CSV file created successfully at: {output_file}")

def copy_steel_files():
    # Define the input and output file paths
    input_html = os.getenv('INPUT_STEEL_HTML', '')
    input_json = os.getenv('INPUT_STEEL_JSON', '')
    output_csv = os.getenv('OUTPUT_STEEL_CSV', '')
    output_folder = os.path.dirname(output_csv)

    print(f"Input HTML Path: {input_html}")
    print(f"Input JSON Path: {input_json}")
    print(f"Output Folder: {output_folder}")

    # Validate paths
    if not input_html or not input_json or not output_csv:
        raise ValueError("Please set the INPUT_STEEL_HTML, INPUT_STEEL_JSON, and OUTPUT_STEEL_CSV environment variables.")

    # Ensure the output folder exists
    try:
        os.makedirs(output_folder, exist_ok=True)
        print(f"Ensured output folder exists: {output_folder}")
    except Exception as e:
        raise RuntimeError(f"Failed to create output folder: {output_folder}. Error: {e}")

    # Copy the steel.html file
    try:
        if os.path.exists(input_html):
            shutil.copy(input_html, output_folder)
            print(f"Copied {input_html} to {output_folder}")
        else:
            print(f"Error: {input_html} does not exist.")
    except Exception as e:
        print(f"Failed to copy {input_html}. Error: {e}")

    # Copy the steel.json file
    try:
        if os.path.exists(input_json):
            shutil.copy(input_json, output_folder)
            print(f"Copied {input_json} to {output_folder}")
        else:
            print(f"Error: {input_json} does not exist.")
    except Exception as e:
        print(f"Failed to copy {input_json}. Error: {e}")

if __name__ == "__main__":
    try:
        print("Starting the steel tool process...")
        run_steel_tool()
        print("Steel tool process completed.")

        print("Processing the steel JSON to CSV...")
        process_steel_json_to_csv()
        print("Steel JSON to CSV processing completed.")
        print("Copying steel.html and steel.json files...")
        copy_steel_files()
        print("Files copied successfully.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while running a command: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
