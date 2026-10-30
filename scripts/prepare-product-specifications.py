"""Translate supplied specifications; preserve source rows and per-size down weights.
This edits local source only. No price, stock, approval or hosted data changes.
"""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
master=json.load(open(root/'docs/catalog-review/master-129-review.json'));groups={}
for row in master['records']:groups.setdefault(row['SKU incl maat'].rsplit('-',1)[0],[]).append(row)
composition={'100% polyester':'100% polyester','92% polyamide, 8% elastaan':'92% polyamide, 8% elastane','90% polyester, 10% elastaan':'90% polyester, 10% elastane','30% viscose, 70% polyester':'30% viscose, 70% polyester','98% polyamide, 2% polyester':'98% polyamide, 2% polyester'}
catalog=json.load(open(root/'lib/catalog.json'));review=[]
for p in catalog['products']:
 code=re.search(r'\d{8}$',p['code']).group();rows=groups[code];r=rows[0];name=p['name'];material=composition.get(r['Samenstelling'],'');care='Wash at 30°C on a gentle cycle.' if r['Wasvoorschrift'] else '';fit='';detail=''
 if name in ['Alpin','Alpin Vest','Alpin Fleece Pro','Alpin Vest Pro']:
  detail='Teddy fleece combined with grid fleece, made from 100% polyester.'
 if name=='Alpin Vest Pro':
  detail='A sleeveless men’s fleece vest with a full-length zip, stand-up collar, two zipped side pockets and a zipped chest pocket. Made from 100% polyester, for everyday use and walking.'
  care+=' Do not bleach or tumble dry. Check the sewn-in care label.'
 if name=='Core.2':detail='Quarter-zip layer in volcanic-ash fabric, made from 92% polyamide and 8% elastane.'
 if name=='Corelosse.2':detail='Single-sided grid fleece, made from 90% polyester and 10% elastane.'
 if name=='Summit':detail='Four-way stretch, TPV and fleece with ultrasonic perforations. Made from 100% polyester. Fabric weight: 340 g/m².'
 if name=='Velvet WMS Hood':detail='Women’s hoodie in coarse-knit, cationic-dyed brushed fabric. Made from 30% viscose and 70% polyester. Fabric weight: 320 g/m².'
 if name=='Snake Scarf':detail='One-size scarf in 100% polyester. Soft teddy fleece combined with grid fleece. Fabric weight: 480 g/m².';fit='One size.'
 if name=='Core Pants':detail='30D double-sided fabric combined with grid fleece. Made from 100% polyester. Fabric weight: 320 g/m².'
 if name=='Nano Down Jacket':
  detail='A lightweight padded men’s winter jacket with a black outer fabric, zip fastening and concealed zipped pockets. According to the supplier, the filling contains approximately 90% white goose down. The wind-resistant, water-repellent outer fabric helps protect against cold wind and light rain. Designed for everyday use and walking. Autumn/Winter 2026 collection. Water-repellent does not mean waterproof.'
  material='Outer fabric: 98% polyamide (nylon), 2% polyester. Filling: approximately 90% white goose down, according to the supplier; the remaining filling composition is not specified.'
  care+=' Supplier’s detailed care note: wash inside out and separately; do not bleach, tumble dry or dry clean. Check the sewn-in care label.'
  fit='Regular fit is listed for S–2XL. Down filling weight by size: S 80 g, M 85 g, L 90 g, XL 95 g, 2XL 100 g, 3XL 105 g. These are filling weights, not the total weight of the jacket.'
 if name=='Nano Down Vest':detail='Sleeveless vest in fabric made from 98% polyamide and 2% polyester. The supplier identifies the fabric as graphene fabric; no thermal or waterproof performance rating is supplied.'
 # Neofit composition is genuinely absent; no invented material or size XS.
 p['content']={'composition':material,'care':care,'fit':fit,'details':detail}
 review.append({'productId':p['id'],'code':code,'source':'BIGK_WEBSITE_MASTER_129_VARIANTEN_ORDER_GECONTROLEERD.xlsx','translationLanguage':'en','content':p['content'],'missingComposition':not bool(material),'sourceRows':[row['SKU incl maat'] for row in rows],'sourceDescriptionNL':[row['Omschrijving NL'] for row in rows if row['Omschrijving NL']]})
(root/'lib/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');(root/'docs/catalog-review/translated-product-specifications.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');print('English material/care/details prepared for 27 records. Neofit composition remains genuinely unspecified. No price or stock changes.')
