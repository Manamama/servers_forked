#!/bin/bash

# Philosophy: "Pull First, Then Commit" (Merge-based, True History)
# This workflow ensures local work is always based on the latest remote state.
# It integrates remote changes before local commits are finalized, allowing for early conflict resolution.
# It maintains a complete, auditable history with merge commits.
# Untracked files are generally safe as Git operations primarily affect tracked files.

# This script is adapted for your forked repository setup.
# It dynamically detects the current branch.

# Dynamically get the current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
REMOTE="fork" # Using your 'fork' remote

echo "Operating on branch: $BRANCH"
echo "Using remote: $REMOTE"

git status
git pull "$REMOTE" "$BRANCH" # Integrates remote changes from your fork via merge
git add .
git status # Sanity check: See what has been staged
git commit -m "Your descriptive commit message"
git push "$REMOTE" "$BRANCH"
git status
