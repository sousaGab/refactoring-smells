import os
import subprocess
import json
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

    # Write the data to a CSV file
    with open(output_file, 'w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        # Write the header
        writer.writerow(['file', 'type', 'smells', 'frame'])
        # Write the rows
        writer.writerows(csv_data)

    print(f"CSV file created successfully at: {output_file}")

if __name__ == "__main__":
    try:
        print("Starting the steel tool process...")
        run_steel_tool()
        print("Steel tool process completed.")

        print("Processing the steel JSON to CSV...")
        process_steel_json_to_csv()
        print("Steel JSON to CSV processing completed.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while running a command: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")