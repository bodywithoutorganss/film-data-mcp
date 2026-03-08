#!/bin/bash
# ABOUTME: Computes active Claude Code time for a milestone from git commit timestamps.
# ABOUTME: Sums inter-commit gaps under a configurable threshold to exclude session breaks.

set -euo pipefail

usage() {
  echo "Usage: scripts/cc-time.sh <grep-pattern> [gap-threshold-minutes]"
  echo ""
  echo "Computes active CC time by summing inter-commit gaps below the threshold."
  echo "Gaps exceeding the threshold are treated as session breaks."
  echo ""
  echo "  grep-pattern          git log --grep pattern (e.g. 'M16', 'BOD-199')"
  echo "  gap-threshold-minutes max minutes between commits before a session break (default: 45)"
  echo ""
  echo "Examples:"
  echo "  scripts/cc-time.sh 'M13'       # all commits mentioning M13"
  echo "  scripts/cc-time.sh 'BOD-199'   # all commits mentioning BOD-199"
  echo "  scripts/cc-time.sh 'M16' 30    # with 30-minute gap threshold"
}

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

PATTERN="$1"
THRESHOLD="${2:-45}"

TIMESTAMPS=()
while IFS= read -r ts; do
  TIMESTAMPS+=("$ts")
done < <(git log --format="%at" --grep="$PATTERN" --reverse)

if [[ ${#TIMESTAMPS[@]} -eq 0 ]]; then
  echo "No commits found matching '$PATTERN'"
  exit 1
fi

if [[ ${#TIMESTAMPS[@]} -eq 1 ]]; then
  date_str=$(date -r "${TIMESTAMPS[0]}" "+%Y-%m-%d %H:%M")
  echo "$PATTERN: 1 commit at $date_str (0m active time)"
  exit 0
fi

threshold_sec=$((THRESHOLD * 60))
total_active=0
session_start=${TIMESTAMPS[0]}
session_end=${TIMESTAMPS[0]}
session_commits=1
sessions=()

for ((i=1; i<${#TIMESTAMPS[@]}; i++)); do
  gap=$((TIMESTAMPS[i] - TIMESTAMPS[i-1]))

  if [[ $gap -gt $threshold_sec ]]; then
    session_duration=$((session_end - session_start))
    total_active=$((total_active + session_duration))
    start_str=$(date -r "$session_start" "+%b %d %H:%M")
    end_str=$(date -r "$session_end" "+%H:%M")
    sessions+=("  $start_str → $end_str ($session_commits commits, $((session_duration / 60))m)")
    session_start=${TIMESTAMPS[i]}
    session_commits=1
  else
    session_commits=$((session_commits + 1))
  fi
  session_end=${TIMESTAMPS[i]}
done

# Close final session
session_duration=$((session_end - session_start))
total_active=$((total_active + session_duration))
start_str=$(date -r "$session_start" "+%b %d %H:%M")
end_str=$(date -r "$session_end" "+%H:%M")
sessions+=("  $start_str → $end_str ($session_commits commits, $((session_duration / 60))m)")

# Output
hours=$((total_active / 3600))
minutes=$(( (total_active % 3600) / 60 ))
decimal_hours=$(echo "scale=1; $total_active / 3600" | bc)

echo "$PATTERN: ${#TIMESTAMPS[@]} commits across ${#sessions[@]} session(s)"
for s in "${sessions[@]}"; do
  echo "$s"
done

if [[ $hours -gt 0 ]]; then
  echo "Total: ${hours}h ${minutes}m (${decimal_hours}h)"
else
  echo "Total: ${minutes}m (${decimal_hours}h)"
fi
