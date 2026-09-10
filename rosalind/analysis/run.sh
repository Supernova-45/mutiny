#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
# Supply an environment containing requirements.lock.txt; never downloads models.
python rosalind/analysis/structure.py
python rosalind/analysis/evidence.py
python rosalind/analysis/contracts.py
python rosalind/analysis/refine_contract.py
python scripts/audit_rojas.py data/raw/rojas-2023-table5.xlsx > rosalind/cohort-validation.json
node rosalind/analysis/response-capture.mjs
python rosalind/analysis/prepare_sequence_view.py
python rosalind/analysis/verify_native.py
python rosalind/analysis/validate.py
python rosalind/analysis/manifest.py
