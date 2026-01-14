# Copilot Instructions

This document provides guidance for AI agents working on this codebase.

## Project Overview

This project manages vocabulary data for a language learning application. The core of the project is a set of JSON files containing vocabulary lists for different language levels (A1, A2, B1, B2) in German and English. A collection of JavaScript and Python scripts are used to process this data. There is also a React Native mobile application that consumes this data.

## Key Concepts

### Vocabulary Data

- Vocabulary data is stored in JSON files in the root directory and in `A1 Vocabulary/` and `A2 Vocabulary/`.
- The naming convention for these files is `[language]-[level]-vocabulary-[status].json`. For example, `b1-vocabulary-complete.json` and `english-b2-vocabulary.json`.
- The JSON files contain an array of vocabulary entries. The structure of these entries can be inferred from the existing data.

### Data Processing Scripts

- A mix of JavaScript and Python scripts are used to manage the vocabulary data.
- **JavaScript scripts** (e.g., `translate-b1-vocabulary.js`, `validate-vocabulary.js`) are used for tasks like translation, validation, and deduplication. These scripts often use the `googleapis` package, suggesting they interact with Google services like Google Translate.
- **Python scripts** (e.g., `apply_all_translations.py`, `check_duplicates.py`) are also used for data manipulation.
- These scripts are typically run from the command line, e.g., `node translate-b1-vocabulary.js` or `python3 generate_vocab_batches.py`.

### Mobile Application

- The `app/` directory contains a React Native application that uses the vocabulary data.
- The `app/GermanTelcB1App/scripts/` directory contains shell scripts for managing iOS app assets, such as icons. For example, `generate-ios-icons.sh` is used to create different sizes of app icons from a source image.

## Developer Workflows

### Managing Vocabulary

- To add or modify vocabulary, you will likely need to edit one of the JSON data files.
- After modifying the data, you may need to run one of the processing scripts to apply changes, such as generating translations or checking for duplicates.

### Working on the Mobile App

- The mobile app is a React Native project. Standard React Native and iOS development practices apply.
- When working with app assets, refer to the scripts in `app/GermanTelcB1App/scripts/` for automation.

## Important Files and Directories

- `*.json` (in root, `A1 Vocabulary/`, `A2 Vocabulary/`): The core vocabulary data.
- `*.js` (in root): JavaScript data processing scripts.
- `*.py` (in root): Python data processing scripts.
- `app/`: The React Native mobile application.
- `app/GermanTelcB1App/scripts/`: Scripts for managing mobile app assets.
- `package.json`: Defines Node.js dependencies.
