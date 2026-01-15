#!/bin/sh
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
case "$BRANCH_NAME" in
  main|production|neptune|staging)
    exit 0
    ;;
esac

if ! echo "$BRANCH_NAME" | grep -qE "^[A-Z]{3}-[0-9]+-[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$"; then
  echo "Branch name '$BRANCH_NAME' does not follow the required pattern!"
  echo "Pattern: PFS-<ticket number>-<type>-<description>"
  exit 1
fi
