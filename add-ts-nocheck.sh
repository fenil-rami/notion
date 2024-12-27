#!/bin/bash

# Description:
# This script adds "// @ts-nocheck" as the first line to all .tsx files
# in the current directory and its subdirectories, excluding any within node_modules.

# Find all .tsx files excluding those in node_modules
find . -type f -name "*.ts" ! -path "*/node_modules/*" | while read -r file; do
    # Read the first line of the file
    first_line=$(head -n 1 "$file")

    # Check if the first line is already "// @ts-nocheck"
    if [ "$first_line" != "// @ts-nocheck" ]; then
        # Create a temporary file
        tmp_file=$(mktemp)

        # Add "// @ts-nocheck" as the first line and append the original file content
        echo "// @ts-nocheck" > "$tmp_file"
        cat "$file" >> "$tmp_file"

        # Replace the original file with the updated file
        mv "$tmp_file" "$file"

        echo "Added @ts-nocheck to: $file"
    else
        echo "@ts-nocheck already present in: $file"
    fi
done
