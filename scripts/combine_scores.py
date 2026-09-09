import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):
    p=ROOT/f'data/derived/{name}.json'
    return json.loads(p.read_text()) if p.exists() else {}
esm=read('esm-scores');binding=read('binding-scores');lock=read('model-lock')
targets={k:{'esm':esm.get(k,{}).get('score'),'binding':binding.get(k,{}).get('affinityNm')} for k in set(esm)|set(binding)}
result={'targets':targets,'models':{'esm':{'name':lock['esmModel'],'revision':lock['esmRevision'],'window':lock['esmWindow'],'definition':lock['esmDefinition'],'order':lock['esmOrdering'],'count':len(esm)},'binding':{**read('binding-run'),'count':sum('affinityNm' in v for v in binding.values())}}}
(ROOT/'data/derived/scores.json').write_text(json.dumps(result,indent=2)+'\n')
print('ESM:',len(esm),'binding:',sum('affinityNm' in v for v in binding.values()))
