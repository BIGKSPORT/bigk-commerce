"""Prepare a reviewable, isolated Supabase staging schema; no network or secrets."""
import re,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def stage(sql):
 sql=sql.replace('bigk.','bigk_staging.').replace("'bigk'","'bigk_staging'")
 sql=re.sub(r'\b(CREATE SCHEMA IF NOT EXISTS|ON SCHEMA|IN SCHEMA) bigk\b',r'\1 bigk_staging',sql)
 sql=re.sub(r'(search_path\s*=\s*)bigk\b',r'\1bigk_staging',sql)
 return re.sub(r'\bbigk_server\b','bigk_staging_server',sql)
parts=['-- Isolated staging only. Existing bigk tables are not changed.\n']
for f in sorted((root/'supabase/migrations').glob('*.sql')):
 if 'staging_bundle' in f.name:continue
 parts.append('-- Source: '+f.name+'\n'+stage(f.read_text()))
parts.append(stage((root/'supabase/templates/server-role.sql').read_text()))
# Seed only the reviewed catalogue. All remain drafts until staging approval.
catalog=json.load(open(root/'lib/catalog.json'));master=json.load(open(root/'docs/catalog-review/master-129-review.json'))['records'];used=set();units=0
for p in catalog['products']:
 code=re.search(r'\d{8}$',p['code']).group();row=next(r for r in master if str(r['SKU incl maat']).startswith(code+'-'))
 quoted=lambda v:"'"+str(v).replace("'","''")+"'"
 parts.append(f"UPDATE bigk_staging.products SET name={quoted(p['name'])},description={quoted(p['description'])},category={quoted(p['category'])},price_cents={round(row['Verkoopprijs incl. btw (€)']*100)},images={quoted(json.dumps(p['images']))},tags={quoted(json.dumps(p['tags']))},active=0,approved=0 WHERE id={quoted(p['id'])};\n")
 for v in p['variants']:
  norm=lambda s:s.upper().replace('XXXL','3XL').replace('XXL','2XL')
  r=next((r for r in master if str(r['SKU incl maat']).startswith(code+'-') and norm(str(r['Maat']))==norm(v['size'])),None)
  if r:
   key=r['SKU incl maat']
   if key in used:raise ValueError('Duplicated inventory: '+key)
   used.add(key)
  stock=int(r['Bevestigde ontvangen voorraad']) if r else 0;units+=stock
  parts.append(f"UPDATE bigk_staging.variants SET product_id={quoted(p['id'])},stock={stock},reserved=0 WHERE id={quoted(v['id'])};\n")
assert len(used)==129 and units==5824
out=root/'supabase/staging/bigk-staging-bundle.sql';out.parent.mkdir(exist_ok=True);out.write_text('\n'.join(parts));print(f'Prepared {out.name}: 20 commerce tables, isolated server group, 129 mapped variants, {units} confirmed units. No remote changes.')
