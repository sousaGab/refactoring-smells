import csv
import subprocess
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def run_snuts_js():
    projects_folder = os.getenv('PROJECTS_FOLDER', '')
    snuts_output_folder = os.getenv('OUTPUT_SNUTS_FOLDER', '')

    # Get the project name
    project_name = input("Enter the project name: ")

    snuts_command = f'''
        curl -X POST http://localhost:3001/export-csv-local \
        -H "Content-Type: application/json" \
        -d '{{"directory":"{projects_folder}{project_name}/"}}' \
        -o {snuts_output_folder}/ouput_snuts.csv
    '''

    print(f"Running command: {snuts_command}")
    subprocess.run(snuts_command, shell=True, check=True)

def filter_snuts_csv():

    # Define the input and output file paths
    input_csv = os.getenv('SNUTS_INPUT_CSV', '')
    output_csv = os.getenv('SNUTS_OUTPUT_CSV', '')
    selected_smell_types = os.getenv('SELECTED_SNUTS_SMELL_TYPES', '').strip('[]').replace('"', '').split(',')
    
    max_number = 5 # Maximum number of rows per smell type

    # Initialize a dictionary to count occurrences of each smell type
    smell_type_counter = {smell_type: 0 for smell_type in selected_smell_types}

    print(f"Selected Smell Types: {smell_type_counter}")

    print(f"Selected Smell Types: {selected_smell_types}")
    print(f"Input CSV Path: {input_csv}")
    print(f"Output CSV Path: {output_csv}")

    # Read the input CSV and filter rows
    filtered_rows = []
    with open(input_csv, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            smell_type = row['type']
            if smell_type in selected_smell_types:
                # Check if the count for this smell type has reached the maximum
                if smell_type_counter[smell_type] < max_number:
                    filtered_rows.append(row)
                    smell_type_counter[smell_type] += 1

    # Write the filtered rows to the output CSV
    with open(output_csv, 'w', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=reader.fieldnames)
        writer.writeheader()
        writer.writerows(filtered_rows)

    print(f"Filtered CSV created successfully at: {output_csv}")


if __name__ == "__main__":
    try:
        
        print("Starting the snutsjs process...")
        run_snuts_js()
        print("snutsjs process completed.")

        print("Filtering snuts.csv...")
        filter_snuts_csv()
        print("Filtering completed.")

    except subprocess.CalledProcessError as e:
        print(f"An error occurred while running a command: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")