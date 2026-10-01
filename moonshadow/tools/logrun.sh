#!/usr/bin/env bash
# logrun.sh - run one command, echo its output, and append command/result to the mission log.
# Usage: logrun.sh "<step label>" "<command string>"
LOG="$HOME/moonshadow/operator-reports/command-log.md"
label="$1"; shift
cmd="$*"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
out="$(bash -c "$cmd" 2>&1)"
code=$?
{
  echo "### [$ts] $label"
  echo '```'
  echo "\$ $cmd"
  echo '```'
  echo "exit: $code"
  echo '```'
  printf '%s\n' "$out" | head -c 6000
  echo '```'
  echo
} >> "$LOG"
printf '%s\n' "$out"
echo "[exit $code]"
exit $code
