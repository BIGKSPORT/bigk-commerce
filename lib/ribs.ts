import pricing from '../docs/catalog-review/ribs-pricing-source.json';
import order from '../docs/catalog-review/ribs-order-source.json';
import type {Product} from './types';
import {validGtin} from './product-identifiers';
const styles=[{key:'LOW',prefix:'243090',name:'RIBS LOW SOCKS',description:'Low-cut knit socks with a ribbed cuff and contrasting BIG K branding.'},{key:'MEDIUM',prefix:'243091',name:'RIBS MEDIUM SOCKS',description:'Mid-height knit socks with a ribbed cuff and contrasting BIG K branding.'},{key:'LONG',prefix:'243092',name:'RIBS LONG SOCKS',description:'Long socks from the RIBS range.'}];
/** Draft only. Order Qty and historical supplier stock never become sellable stock. */
export function ribsProducts():Product[]{
 const allEans=new Set<string>();
 for(const row of pricing.rows){if(!validGtin(row.ean)||allEans.has(row.ean))throw Error('Invalid or duplicated source RIBS EAN');allEans.add(row.ean)}
 for(const row of order.rows){const match=pricing.rows.find(p=>p.article===row.article&&p.size===row.size);if(!match||match.ean!==row.ean)throw Error('RIBS order / pricing identity conflict: '+row.article+' '+row.size)}
 return styles.flatMap(style=>['White','Black','Red'].map(colour=>{
  const rows=pricing.rows.filter(r=>r.article.startsWith(style.prefix)&&r.colour===colour);if(rows.length!==2||new Set(rows.map(r=>r.msrpCents)).size!==1)throw Error('Review RIBS colour / price mapping');
  const id='RIBS-'+style.key+'-'+colour.toUpperCase(),parent='RIBS-'+style.key+'-WHITE',article=rows[0].article,key=style.key.toLowerCase()+'-'+colour.toLowerCase();
  const images=style.key==='LONG'?[]:['/products/ribs/'+key+'.webp',...(style.key==='MEDIUM'?['/products/ribs/'+key+'-main.webp']:[]),...(id==='RIBS-LOW-RED'?['/products/ribs/low-red-side.webp','/products/ribs/low-red-angle.webp','/products/ribs/low-red-front.webp']:[])];
  const variants=rows.map(r=>({id:'RIBS-'+r.article+'-'+r.size,size:r.size,stock:0,reserved:0,reported:null}));
  return {id,version:0,name:style.name,slug:'ribs-'+key+'-socks',code:article,category:'Accessories',description:style.description,priceCents:rows[0].msrpCents,approved:false,active:false,featured:false,tags:['RIBS','Socks',style.key.toLowerCase()],images,variants,content:{composition:'',care:'',fit:'Unisex size ranges: 35–39 and 40–43.',details:style.description,trade:{officialName:style.name,supplierArticle:article,colour,...(id===parent?{}:{parentProductId:parent}),identifiers:Object.fromEntries(rows.map((r,i)=>[variants[i].id,{sku:r.article+'-'+r.size,gtin:r.ean,verified:true,colour,supplierArticle:article}]))}}};
 }));
}
