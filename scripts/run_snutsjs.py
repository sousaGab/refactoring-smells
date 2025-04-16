import csv
import subprocess
import os
import asyncio
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

async def run_snuts_js():
    """Run the Snuts.js tool."""
    projects_folder = validate_env_variable('PROJECTS_FOLDER')
    snuts_output_folder = validate_env_variable('OUTPUT_SNUTS_FOLDER')

    project_name = input("Enter the project name: ").strip()

    snuts_command = (
        f'curl -X POST http://localhost:3001/export-csv-local '
        f'-H "Content-Type: application/json" '
        f'-d \'{{"directory":"{projects_folder}{project_name}/"}}\' '
        f'-o {snuts_output_folder}/output_snuts.csv'
    )

    # log_info(f"Running command: {snuts_command}")
    # subprocess.run(snuts_command, shell=True, check=True)
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

def filter_snuts_csv():
    """Filter the Snuts.js CSV file based on selected smell types."""
    input_csv = validate_env_variable('SNUTS_INPUT_CSV')
    output_csv = validate_env_variable('SNUTS_OUTPUT_CSV')
    selected_smell_types = os.getenv('SELECTED_SNUTS_SMELL_TYPES', '').strip('[]').replace('"', '').split(',')
    max_number = 5  # Maximum number of rows per smell type

    # Initialize a dictionary to count occurrences of each smell type
    smell_type_counter = {smell_type: 0 for smell_type in selected_smell_types}

    log_info(f"Selected Smell Types: {selected_smell_types}")
    log_info(f"Input CSV Path: {input_csv}")
    log_info(f"Output CSV Path: {output_csv}")

    # Read the input CSV and filter rows
    filtered_rows = []
    try:
        with open(input_csv, 'r') as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                smell_type = row['type']
                if smell_type in selected_smell_types:
                    # Check if the count for this smell type has reached the maximum
                    if smell_type_counter[smell_type] < max_number:
                        filtered_rows.append(row)
                        smell_type_counter[smell_type] += 1
    except FileNotFoundError:
        log_error(f"Input CSV file not found: {input_csv}")
        return
    except Exception as e:
        log_error(f"An error occurred while reading the input CSV: {e}")
        return

    # Write the filtered rows to the output CSV
    try:
        with open(output_csv, 'w', newline='') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(filtered_rows)
        log_info(f"Filtered CSV created successfully at: {output_csv}")
    except Exception as e:
        log_error(f"An error occurred while writing the output CSV: {e}")

async def main():
    try:
        log_info("Starting the Snuts.js process...")
        await run_snuts_js()
        log_info("Snuts.js process completed.")

        log_info("Filtering Snuts.js CSV...")
        filter_snuts_csv()
        log_info("Filtering completed.")
    except subprocess.CalledProcessError as e:
        log_error(f"An error occurred while running a command: {e}")
    except Exception as e:
        log_error(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())