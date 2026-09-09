"""Predict affinity for published class-I pairs, not experimentally assigned epitopes."""
import os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.environ.setdefault('MHCFLURRY_DATA_DIR',str(ROOT/'work/model-cache/mhcflurry'))
os.environ.setdefault('TF_USE_LEGACY_KERAS','1')
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL','2')
import json
import math
import importlib.metadata
from mhcflurry import Class1AffinityPredictor
from mhcflurry.downloads import get_default_class1_models_dir

targets=json.loads((ROOT/'public/data/cohort.json').read_text())['targets']
predictor=Class1AffinityPredictor.load()
result={}
for t in targets:
    try:
        value=float(predictor.predict(peptides=[t['epitope1']],alleles=[t['hla1']])[0])
        result[t['id']]={'affinityNm':round(value,6)} if math.isfinite(value) else {'error':'nonfinite prediction'}
    except (ValueError,KeyError) as e:
        result[t['id']]={'error':str(e)}
    print(t['id'],result[t['id']],flush=True)
(ROOT/'data/derived/binding-scores.json').write_text(json.dumps(result,indent=2)+'\n')
(ROOT/'data/derived/binding-run.json').write_text(json.dumps({'version':importlib.metadata.version('mhcflurry'),'modelsDirectoryName':Path(get_default_class1_models_dir()).name,'prediction':'binding affinity nM','pairSelection':'published best class-I peptide/allele'},indent=2)+'\n')
