#!/bin/bash

# Script to stop tracking files that should be ignored by Git
# This removes files from Git's index but keeps them in the working directory

echo "Stopping tracking of files that should be ignored..."

# Remove node_modules directory from Git tracking
echo "Removing node_modules from Git tracking..."
git rm -r --cached node_modules

# Remove package-lock.json from Git tracking (if it exists)
if [ -f "package-lock.json" ]; then
    echo "Removing package-lock.json from Git tracking..."
    git rm --cached package-lock.json
fi

# Remove any .env files from Git tracking (if they exist)
if ls .env* 1> /dev/null 2>&1; then
    echo "Removing .env files from Git tracking..."
    git rm --cached .env*
fi

# Remove any log files from Git tracking
if ls *.log 1> /dev/null 2>&1; then
    echo "Removing log files from Git tracking..."
    git rm --cached *.log
fi

echo "Done! The ignored files are no longer tracked by Git."
echo "Make sure to commit these changes:"
echo "git add .gitignore"
echo "git commit -m \"Stop tracking ignored files\""