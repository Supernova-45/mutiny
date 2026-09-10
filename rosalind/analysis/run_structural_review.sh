#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
PYTHON="${PYTHON:-python3}"
NODE="${NODE:-node}"
"$PYTHON" rosalind/comparison-review/independent.py
"$PYTHON" rosalind/comparison-review/build_fixtures.py
"$NODE" rosalind/comparison-review/check-engine.mjs
"$PYTHON" rosalind/contrast-kras/build_case.py
"$PYTHON" rosalind/analysis/manifest.py
