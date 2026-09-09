from pathlib import Path
import hashlib,json,platform,subprocess
O=Path(__file__).resolve().parents[1];R=O.parent
paths=sorted(p for p in O.rglob('*') if p.is_file() and p.name!='manifest.json' and '__pycache__' not in p.parts)
manifest={'schemaVersion':'0.1.0','scope':'Portable evidence artifacts; input datasets remain in repository or fixtures/sources','files':[{'path':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in paths]}
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
