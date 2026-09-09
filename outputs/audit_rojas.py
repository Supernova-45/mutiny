"""Read-only, checksum-pinned audit of Rojas 2023 Supplementary Table 5.

Usage: python3 audit_rojas.py path/to/41586_2023_6063_MOESM4_ESM.xlsx
Requires Python's standard library only. Prints JSON; never changes the input.
Annotation availability is NOT experimentally established HLA restriction.
"""
import collections
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

SOURCE = ('https://media.springernature.com/original/springer-static/esm/'
          'art%3A10.1038%2Fs41586-023-06063-y/MediaObjects/'
          '41586_2023_6063_MOESM4_ESM.xlsx')
SHA256 = 'c9942caa0de461e87c3725ae42377fea2a283cd170074fb2e36820303b429595'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def audit(path):
    actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual_hash != SHA256:
        raise ValueError('Source checksum changed; review before updating the lock.')
    with zipfile.ZipFile(path) as z:
        strings = [ ''.join(si.itertext()) for si in
                    ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = workbook.findall('s:sheets/s:sheet', NS)
        if len(sheets) != 1 or sheets[0].get('name') != 'ml41081_targets_with_elispot':
            raise ValueError('Unexpected worksheet layout')
        rows = []
        for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('s:sheetData/s:row', NS):
            cells = {}
            for c in row.findall('s:c', NS):
                v = c.find('s:v', NS)
                if v is not None and v.text is not None:
                    value = strings[int(v.text)] if c.get('t') == 's' else v.text
                    cells[re.sub(r'\d', '', c.get('r'))] = value
            if cells:
                rows.append(cells)
    header, rows = rows[0], rows[1:]
    if header['O'] != 'ELISpot Response':
        raise ValueError('Unexpected response column')
    counts = dict(collections.Counter(r['O'] for r in rows))
    expected = {'No response': 200, 'De novo response': 23,
                'De novo response in pool': 7, 'No data': 2}
    if counts != expected or len({(r['A'], r['B']) for r in rows}) != len(rows):
        raise ValueError('Count or unique target identity check failed')
    def has_pair(r, columns):
        return all(bool(r.get(c, '').strip()) for c in columns)
    def esm_metadata(r):
        return bool(r.get('D') and r.get('G') and
                    re.fullmatch('[A-Z][0-9]+[A-Z]', r.get('E', '')))
    individual = [r for r in rows if r['O'] in ('No response', 'De novo response')]
    esm = [r for r in rows if esm_metadata(r)]
    comparison = [r for r in individual if esm_metadata(r)]
    return {
        'source_url': SOURCE, 'sha256': actual_hash,
        'worksheet': sheets[0].get('name'), 'records': len(rows),
        'patients': len({r['A'] for r in rows}), 'response_labels': counts,
        'predicted_class_I_pair_present': sum(has_pair(r, 'IJ') for r in rows),
        'predicted_class_II_pair_present': sum(has_pair(r, 'LM') for r in rows),
        'both_predicted_pairs_present': sum(has_pair(r, 'IJLM') for r in rows),
        'individual_outcome_records': len(individual),
        'esm_metadata_eligible': len(esm),
        'esm_metadata_and_individual_outcome': len(comparison),
        'esm_metadata_and_individual_outcome_labels': dict(collections.Counter(r['O'] for r in comparison)),
        'per_patient': {p: dict(collections.Counter(r['O'] for r in rows if r['A'] == p))
                        for p in sorted({r['A'] for r in rows}, key=int)},
        'metadata_excluded_targets': [f"{r['A']}:{r['B']}" for r in rows if not esm_metadata(r)],
        'pool_members': [f"{r['A']}:{r['B']}" for r in rows if 'pool' in r['O']],
        'interpretation': [
            'Predicted pairs cannot assign the class mediating an ELISpot response.',
            'Pool members and No data records are excluded from binary outcome analysis.',
            'No response means no response detected under the published assay conditions.',
            'ESM eligibility here checks metadata only, not protein mapping or model compatibility.',
            'The paper reports 25 responses including two pool responses; do not convert this into 25 individually identified positives.',
        ],
    }


if __name__ == '__main__':
    print(json.dumps(audit(Path(sys.argv[1])), indent=2))
