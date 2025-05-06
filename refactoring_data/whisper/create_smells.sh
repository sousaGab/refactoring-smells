#!/bin/bash

# Navigate to the folder where you want to create the directories
cd /home/gabriel/Desktop/research/refactoring-data/copilot

# Loop to create directories smell_4 through smell_50
for i in {1..145}
do
    mkdir "smell_$i"
done

