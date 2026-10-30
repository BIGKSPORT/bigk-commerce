import {requireAdmin,failure} from '@/lib/security';
import catalog from '@/lib/catalog.json';
import source from '@/docs/catalog-review/master-129-review.json';
export async function GET(req:Request){try{await requireAdmin(req);return Response.json({name:source.source,variants:source.rows,units:source.confirmedUnits,records:source.records.map(r=>{const code=String(r['SKU incl maat']).split('-')[0],spec=catalog.products.find(p=>p.code.endsWith(code))?.content;return {...r,...(spec?{'Samenstelling':spec.composition||null,'Wasvoorschrift':spec.care||null}:{})}})},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
