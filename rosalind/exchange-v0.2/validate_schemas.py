"""Validate proposal schemas and roundtrip artifacts; SHA semantics tested in Node."""
import json,copy
from pathlib import Path
import jsonschema
O=Path(__file__).resolve().parent
for name in ['project','request','return']:
 s=json.loads((O/(name+'.schema.json')).read_text());jsonschema.Draft202012Validator.check_schema(s)
 doc=json.loads((O.parent/'roundtrip-v0.2'/(name+'.json')).read_text());jsonschema.validate(doc,s)
 bad=copy.deepcopy(doc);bad['schemaVersion']='0.1.0'
 try:jsonschema.validate(bad,s)
 except jsonschema.ValidationError:pass
 else:raise AssertionError('Version confusion accepted')
print('Three proposal schemas and real roundtrip validated; 0.1.0 rejected by each')
