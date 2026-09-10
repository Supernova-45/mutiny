#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
# Offline regeneration from retained native/tool receipts; no new live execution claimed.
python rosalind/analysis/summarize_validation.py
python rosalind/exchange-v0.2/build_schemas.py
node rosalind/exchange-v0.2/build-roundtrip.mjs
node rosalind/exchange-v0.2/test-exchange.mjs
python rosalind/exchange-v0.2/validate_schemas.py
python rosalind/analysis/verify_second_return.py
python rosalind/analysis/manifest.py
