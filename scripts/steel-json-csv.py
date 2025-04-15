import json
import csv

# Define the input and output file paths
input_file = '/home/gabriel/Desktop/research/smell-detection-tools/steel/steel.json'
output_file = '/home/gabriel/Desktop/research/smell-detection-tools/steel/steel_output.csv'

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
    writer.writerow(['file', 'type', 'smells','frame'])
    # Write the rows
    writer.writerows(csv_data)

print(f"CSV file created successfully at: {output_file}")