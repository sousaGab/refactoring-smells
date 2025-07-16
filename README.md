# Refactoring Smells Dataset

This project provides an artefac and dataset designed for research on refactoring test smells in JavaScript open-source projects. The dataset is intended to support studies leveraging Large Language Models (LLMs) such as GitHub Copilot and AWS CodeWhisperer.

## Overview

The dataset includes data collected from various JavaScript projects, focusing on identifying and analyzing test smells. Test smells are patterns in test code that may indicate potential maintenance issues or inefficiencies. By studying these smells, researchers aim to improve the quality and maintainability of test code.

## Objectives

- To study the effectiveness of LLMs in identifying and refactoring test smells.
- To compare the performance of tools like GitHub Copilot and AWS CodeWhisperer in addressing test smells.
- To provide insights into best practices for maintaining high-quality test code in JavaScript projects.

## Tools Used

- **GitHub Copilot**: An AI-powered code completion tool developed by GitHub.
- **AWS CodeWhisperer**: An AI coding companion provided by Amazon Web Services.

## Repository Folder Guide

- **datasets/**  
  Contains the datasets used in this research, including lists of repositories, refined selections, and results (e.g., `repositories.csv`, `dataset_results.xlsx`). These files provide the foundational data for analysis and experiments.

- **projects/**  
  Includes the source code for each open-source project analyzed in this research. Each subfolder corresponds to a specific project under study.

- **refactoring_data/**  
  Stores samples of each test smell studied in this research. This includes original and refactored code examples, organized by tool and smell type.

- **scripts/**  
  Contains scripts used to run smell detection tools, analyze code metrics, process datasets, and automate various research tasks. See [scripts/SCRIPTS_GUIDE.md](scripts/SCRIPTS_GUIDE.md) for detailed usage instructions.

- **smell_detection_tools/**  
  Houses the tools and utilities for detecting test smells in JavaScript projects. Each tool is organized in its own subdirectory.

- **smells_detected/**  
  Contains the output files listing the smells detected in each project. This includes both the full set of detected smells and the subset selected for further study.

  ## Related Article

This dataset and repository support the research presented in the article:

📄 **"Improving JavaScript Test Quality with Large Language Models: Lessons from Test Smell Refactoring"**  
The article is available in the root directory of this repository: [article.pdf](./article.pdf)

The article discusses the methodology, challenges, and results of using LLMs like GitHub Copilot and AWS CodeWhisperer to automate the refactoring of test smells in JavaScript projects. It provides a detailed account of the dataset construction, refactoring strategies, and evaluation metrics, offering valuable insights for researchers and practitioners working at the intersection of software quality and AI-powered development tools.

Please refer to the article for a comprehensive explanation of the motivation, design decisions, and findings of this research.
