"""Resolve RefSeq transcripts and require the published WT flank at the stated mutation.

NCBI GenBank records are cached, checksummed, and contain versioned transcript and
protein accessions. Unresolved rows remain excluded, never guessed from gene names.
"""
import hashlib
import io
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
from Bio import SeqIO

ROOT = Path(__file__).resolve().parents[1]
targets = json.loads((ROOT/'public/data/cohort.json').read_text())['targets']
ids = sorted({t['transcript'] for t in targets if t['esmMetadataEligible']})
cache = ROOT / 'data/raw/refseq'
cache.mkdir(exist_ok=True)
records = {}
for i in range(0, len(ids), 35):
    batch = ids[i:i+35]
    path = cache / f'batch-{i//35:02d}.gb'
    if not path.exists():
        url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?' + urllib.parse.urlencode(
            dict(db='nuccore', id=','.join(batch), rettype='gb', retmode='text', tool='vaccine_recognition_atlas'))
        for attempt in range(4):
            try:
                payload = urllib.request.urlopen(url, timeout=90).read()
                if not payload.startswith(b'LOCUS'):
                    raise ValueError('Not GenBank data')
                path.write_bytes(payload)
                break
            except Exception:
                if attempt == 3: raise
                time.sleep(2*(attempt+1))
        time.sleep(0.4)
    for rec in SeqIO.parse(io.StringIO(path.read_text()), 'genbank'):
        records[rec.id.split('.')[0]] = (rec, path)
    print('Fetched batch', i//35, flush=True)
mapping = {}
for t in targets:
    result = {'status': 'excluded', 'reason': 'missing transcript or non-single substitution'}
    if t['esmMetadataEligible']:
        pair = records.get(t['transcript'])
        result['reason'] = 'transcript not returned'
        if pair:
            rec, file = pair
            wt, position, mutant = re.fullmatch(r'([A-Z])(\d+)([A-Z])', t['mutation']).groups()
            pos = int(position)-1
            result['reason'] = 'published wild-type flank does not match at annotated position'
            for feature in rec.features:
                if feature.type != 'CDS' or 'translation' not in feature.qualifiers:
                    continue
                protein = feature.qualifiers['translation'][0]
                if pos >= len(protein) or protein[pos] != wt:
                    continue
                # Require equal flanks, exactly one stated substitution, and an anchored match.
                flank = t['wildtype']
                differences = [j for j,(a,b) in enumerate(zip(flank,t['mutant'])) if a!=b]
                if len(flank)!=len(t['mutant']) or len(differences)!=1:
                    continue
                j = differences[0]
                if flank[j]!=wt or t['mutant'][j]!=mutant or pos-j<0:
                    continue
                if protein[pos-j:pos-j+len(flank)] != flank:
                    continue
                result = dict(status='verified', transcriptVersion=rec.id,
                    proteinAccession=feature.qualifiers.get('protein_id', ['unknown'])[0],
                    protein=protein, position=int(position), wildtype=wt, mutant=mutant,
                    genbankFile=str(file.relative_to(ROOT)),
                    genbankSha256=hashlib.sha256(file.read_bytes()).hexdigest(),
                    proteinSha256=hashlib.sha256(protein.encode()).hexdigest())
                break
    mapping[t['id']] = result
(ROOT/'data/derived/protein-mapping.json').write_text(json.dumps(mapping,indent=2)+'\n')
print('Verified',sum(m['status']=='verified' for m in mapping.values()),'of',len(targets),flush=True)
