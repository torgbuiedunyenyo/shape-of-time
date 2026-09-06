"""Copy selected Railway credentials to an ignored local file. Never print values."""
import json, os, subprocess
from pathlib import Path

def variables(service):
    return json.loads(subprocess.check_output(['railway','variable','list','--service',service,'--environment','production','--json']))

app, db = variables('shape-of-time'), variables('Postgres')
selected = {k: app[k].strip().strip('"') for k in ['OPENAI_API_KEY','S3_ENDPOINT','S3_BUCKET','S3_REGION','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY'] if k in app}
selected.update({k: app[k] for k in ['DATABASE_SCHEMA', 'PROVIDER_BUDGET_USD', 'READER_EDITION', 'PREPARATION_ENABLED'] if k in app})
selected.update(DATABASE_URL=db['DATABASE_PUBLIC_URL'], GENERATION_ENABLED='false', PORT='3000')
p = Path('.env')
fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as f:
    for k,v in selected.items():
        f.write(k+'='+json.dumps(v)+'\n')
print('Saved selected Railway configuration to ignored .env; generation disabled.')
