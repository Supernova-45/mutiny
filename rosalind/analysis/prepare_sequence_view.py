"""Derive measured HHAT peptide alignment from deposited chain-C SEQRES records."""
from pathlib import Path
import hashlib,json
from Bio.SeqUtils import seq1
R=Path(__file__).resolve().parents[2];O=R/'rosalind/plugin-results';rows=[];inputs=[]
for pdb in ['6UJQ','6UJO','6UK2','6UK4']:
 p=R/'data/raw'/f'{pdb}.pdb';res=[]
 for line in p.read_text().splitlines():
  if line.startswith('SEQRES') and line[11]=='C':res+=line[19:70].split()
 sequence=''.join(seq1(x) for x in res);expected='KQWLVWLFL' if pdb in ('6UJO','6UK4') else 'KQWLVWLLL';assert sequence==expected
 rows.append(f'>{pdb}_C measured HHAT peptide; HLA-A*02:06; source positions 68-76\n{sequence}\n');inputs.append({'pdb':pdb,'chain':'C','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sourceUrl':f'https://www.rcsb.org/structure/{pdb}'})
path=O/'hhat-peptides.afa';path.write_text(''.join(rows))
(O/'hhat-peptides.provenance.json').write_text(json.dumps({'producer':'Codex local source adapter','script':'rosalind/analysis/prepare_sequence_view.py','inputs':inputs,'outputSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'method':'Exact deposited SEQRES chain-C extraction; equal-length ungapped alignment; no sequence prediction','coordinates':'Alignment columns equal peptide positions 1-9. Source HHAT position = peptide position +67; L75F = column8; W6 = column6.','notAssumed':'Not a vaccine cohort epitope; no arbitrary target structure attachment.'},indent=2)+'\n')
