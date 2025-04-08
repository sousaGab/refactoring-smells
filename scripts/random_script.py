import pandas as pd
import random
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load the CSV file into a pandas DataFrame
input_file = os.getenv("INPUT_FILE")
output_file = os.getenv("OUTPUT_FILE")

# Read the CSV file
df = pd.read_csv(input_file)

# Randomly select 10 repositories
random_indices = random.sample(range(len(df)), 10)
random_repos = df.iloc[random_indices]

# Save the selected repositories to a new CSV file
random_repos.to_csv(output_file, index=False)
