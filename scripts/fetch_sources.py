"""Verify cached publication inputs; restore missing original XLSX/PDB files.

RefSeq batches are versioned snapshots committed to the repository. Restore a
missing batch from git rather than silently substituting a newer record set.
"""
import hashlib
import json
from pathlib import Path
import urllib.request
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'data/derived/source-manifest.json').read_text())
for item in manifest['inputs']:
    path=ROOT/item['path']
    if not path.exists():
        if path.suffix=='.gb':
            raise RuntimeError(f'Restore the versioned reference snapshot from git: {item["path"]}')
        payload=urllib.request.urlopen(item['source'],timeout=60).read()
        if hashlib.sha256(payload).hexdigest()!=item['sha256']:
            raise RuntimeError(f'Remote source changed: {item["path"]}; do not overwrite the pinned input')
        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(payload)
    if hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:
        raise RuntimeError(f'Input checksum mismatch: {item["path"]}')
    print('Verified',item['path'])
