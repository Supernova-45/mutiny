"""Build the browser dataset from the pinned publication supplement."""
import json
from pathlib import Path
import re
import openpyxl
from audit_rojas import audit

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/raw/rojas-2023-table5.xlsx'
report = audit(SOURCE)
rows = list(openpyxl.load_workbook(SOURCE, read_only=True, data_only=True).active.values)[1:]
labels = {'De novo response': 'response', 'No response': 'undetected',
          'De novo response in pool': 'pooled', 'No data': 'missing'}
targets = []
for row in rows:
    if not row[0]:
        continue
    pt, number, gene, transcript, mutation, mutant, wt, coding, hla1, ep1, wt1, hla2, ep2, wt2, outcome = row
    single = re.fullmatch(r'([A-Z])(\d+)([A-Z])', mutation or '')
    targets.append(dict(id=f'{pt}:{number}', patient=pt, number=str(number), gene=gene,
        transcript=transcript, mutation=mutation, mutant=mutant, wildtype=wt,
        coding=coding, hla1=hla1, epitope1=ep1, wildtypeEpitope1=wt1,
        hla2=hla2, epitope2=ep2, outcome=labels[outcome], sourceLabel=outcome,
        esmMetadataEligible=bool(transcript and wt and single),
        esm=None, binding=None, proteinMapping=None))
scores_file = ROOT / 'data/derived/scores.json'
scores = json.loads(scores_file.read_text()) if scores_file.exists() else {}
mapping_file = ROOT / 'data/derived/protein-mapping.json'
mapping = json.loads(mapping_file.read_text()) if mapping_file.exists() else {}
for target in targets:
    item = scores.get('targets', {}).get(target['id'], {})
    target.update({key: item[key] for key in ('esm', 'binding') if key in item})
    target['proteinMapping'] = mapping.get(target['id'])
    target['comparisonEligible'] = (target['outcome'] in ('response', 'undetected') and
                                  target['esm'] is not None and target['binding'] is not None)
data = {'study': 'Rojas et al., Nature 2023', 'doi': '10.1038/s41586-023-06063-y',
        'source': report['source_url'], 'sourceSha256': report['sha256'],
        'targets': targets, 'audit': report, 'models': scores.get('models', {}),
        'rosalind': {'status': 'handoff-pending', 'contributions': []}}
for file in ('public/data/cohort.json', 'data/derived/cohort.json'):
    (ROOT / file).write_text(json.dumps(data, indent=2) + '\n')
print(f'Built {len(targets)} targets; {sum(t["comparisonEligible"] for t in targets)} comparable')
