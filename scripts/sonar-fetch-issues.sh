#!/usr/bin/env bash
# Fetch open SonarCloud issues for MVP-2 (public API — no token for read).
# Usage: ./scripts/sonar-fetch-issues.sh [SECURITY|RELIABILITY|MAINTAINABILITY|all]
set -euo pipefail

PROJECT_KEY="KarmaCummunity_MVP-2"
QUALITY="${1:-all}"
BASE="https://sonarcloud.io/api/issues/search?componentKeys=${PROJECT_KEY}&resolved=false&ps=100"

if [[ "$QUALITY" != "all" ]]; then
  BASE="${BASE}&impactSoftwareQualities=${QUALITY}"
fi

curl -s "$BASE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"total={data['total']}\")
for i in data.get('issues', []):
    comp = i['component'].split(':', 1)[-1]
    print(f\"{comp}:{i.get('line','?')} [{i['severity']}] {i['rule']}: {i['message']}\")
"
