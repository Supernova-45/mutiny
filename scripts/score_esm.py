"""Frozen masked-marginal scoring. Run after map_proteins.py; caches and resumes."""
import json
import os
from pathlib import Path
import time
ROOT=Path(__file__).resolve().parents[1]
os.environ.setdefault('HF_HOME',str(ROOT/'work/model-cache/huggingface'))
os.environ.setdefault('TOKENIZERS_PARALLELISM','false')
os.environ.setdefault('HF_HUB_DISABLE_XET','1')
import torch
from transformers import AutoTokenizer, AutoModelForMaskedLM

lock=json.loads((ROOT/'data/derived/model-lock.json').read_text())
mapping=json.loads((ROOT/'data/derived/protein-mapping.json').read_text())
path=ROOT/'data/derived/esm-scores.json'
scores=json.loads(path.read_text()) if path.exists() else {}
device='mps' if torch.backends.mps.is_available() else 'cpu'
torch.set_num_threads(6)
print('Loading pinned ESM-2 on',device,flush=True)
tokenizer=AutoTokenizer.from_pretrained(lock['esmModel'],revision=lock['esmRevision'])
model=AutoModelForMaskedLM.from_pretrained(lock['esmModel'],revision=lock['esmRevision'],use_safetensors=True).eval().to(device)
for key,m in mapping.items():
    if key in scores or m['status']!='verified':continue
    pos=m['position']-1;protein=m['protein'];width=lock['esmWindow']
    start=max(0,min(pos-width//2,len(protein)-width));end=min(len(protein),start+width)
    seq=protein[start:end];offset=pos-start
    assert seq[offset]==m['wildtype']
    inputs=tokenizer(seq,return_tensors='pt')
    assert inputs['input_ids'][0,offset+1].item()==tokenizer.convert_tokens_to_ids(m['wildtype'])
    inputs['input_ids'][0,offset+1]=tokenizer.mask_token_id
    inputs={k:v.to(device) for k,v in inputs.items()}
    with torch.inference_mode():
        logits=model(**inputs).logits[0,offset+1]
        value=float((logits[tokenizer.convert_tokens_to_ids(m['mutant'])]-logits[tokenizer.convert_tokens_to_ids(m['wildtype'])]).cpu())
    scores[key]={'score':round(value,6),'windowStart':start+1,'windowEnd':end,'device':device}
    temp=path.with_suffix('.tmp');temp.write_text(json.dumps(scores,indent=2)+'\n');temp.replace(path)
    print(key,value,flush=True)
print('Completed',len(scores),'scores',flush=True)
