#!/bin/bash

# Philosophy: "Pull First, Then Commit" (Merge-based, True History)
# This workflow ensures local work is always based on the latest remote state.
# It integrates remote changes before local commits are finalized, allowing for early conflict resolution.
# It maintains a complete, auditable history with merge commits.
# Untracked files are generally safe as Git operations primarily affect tracked files.

# This script is adapted for your forked repository setup.
# It dynamically detects the current branch.

# --- Remote Configuration Setup (Idempotent) ---
# Ensure 'fork' points to your personal fork and 'origin' points to the upstream.

FORK_URL="https://github.com/Manamama/servers_forked"
UPSTREAM_URL="https://github.com/modelcontextprotocol/servers/"

# Get current remote URLs
CURRENT_ORIGIN_URL=$(git remote get-url origin 2>/dev/null)
CURRENT_FORK_URL=$(git remote get-url fork 2>/dev/null)

# Case 1: 'origin' currently points to the fork URL (typical after a fresh clone of the fork)
if [ "$CURRENT_ORIGIN_URL" == "$FORK_URL" ]; then
    if [ -z "$CURRENT_FORK_URL" ]; then # If 'fork' remote doesn't exist yet
        echo "Renaming 'origin' to 'fork'..."
        git remote rename origin fork
    elif [ "$CURRENT_FORK_URL" == "$FORK_URL" ]; then # If 'fork' already exists and is correct
        echo "'origin' and 'fork' both point to the fork. Removing redundant 'origin'..."
        git remote remove origin
    else # 'fork' exists but points to a different URL
        echo "Warning: 'origin' points to fork, but 'fork' remote exists and points to a different URL. Please resolve manually."
        # We'll proceed to try and set up 'fork' and 'origin' correctly below.
    fi
fi

# Ensure 'fork' remote exists and points to the correct URL
if ! git remote get-url fork &>/dev/null; then
    echo "Adding 'fork' remote pointing to your personal fork..."
    git remote add fork "$FORK_URL"
elif [ "$(git remote get-url fork)" != "$FORK_URL" ]; then
    echo "'fork' remote exists but points to a different URL. Updating 'fork' remote URL..."
    git remote set-url fork "$FORK_URL"
fi

# Ensure 'origin' remote exists and points to the correct URL (upstream)
if ! git remote get-url origin &>/dev/null; then
    echo "Adding 'origin' remote pointing to the upstream repository..."
    git remote add origin "$UPSTREAM_URL"
elif [ "$(git remote get-url origin)" != "$UPSTREAM_URL" ]; then
    echo "'origin' remote exists but points to a different URL. Updating 'origin' remote URL..."
    git remote set-url origin "$UPSTREAM_URL"
fi

# --- End Remote Configuration Setup ---

# Dynamically get the current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
REMOTE="fork" # Using your 'fork' remote, which is now guaranteed to exist and be correct

echo "Operating on branch: $BRANCH"
echo "Using remote: $REMOTE"

git status
git pull "$REMOTE" "$BRANCH" # Integrates remote changes from your fork via merge
git add .
git status # Sanity check: See what has been staged
git commit -m "Your descriptive commit message"
git push "$REMOTE" "$BRANCH"
git status
