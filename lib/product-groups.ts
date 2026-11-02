import type {Product,Variant} from './types';
/** Explicit source-reviewed identities; never infer interchangeability from a name or prefix. */
export const reviewedGroups=[
 {parent:'P001',members:['P001','P002'],articles:['25303101','25303102'],evidence:'Owner ALPIN brief, source labels and twelve confirmed EANs'},
 {parent:'P006',members:['P006','P007'],articles:['25303201','25303202'],evidence:'Latest owner correction: Alpin Vest, stand-collar model, Black and Beige/Black; distinct from hooded 253017xx'},
 {parent:'P012',members:['P012','P014'],articles:['25301701','25301702'],evidence:'Owner explicitly confirmed hooded vest articles: Black 01, Cream 02; Dusty Blue 03 identifiers confirmed in owner screenshot; stock quantities unconfirmed'},
 {parent:'P003',members:['P003','P004','P005'],articles:['25301801','25301802','25301803'],evidence:'Owner-checked 129-variant master, Core.2 specification and source shoot'},
 {parent:'P008',members:['P008','P009'],articles:['25301601','25301603'],evidence:'Owner-checked master, hooded full-zip article mapping and Cream physical label'},
 {parent:'P015',members:['P015','P016'],articles:['25301902','25301903'],evidence:'Owner-checked master and Corelosse.2 source folder'},
 {parent:'P023',members:['P023','P024','P025'],articles:['25302401','25302402','25302403'],evidence:'Owner-checked master and Snake Scarf source specification/colour sheet'},
] as const;
export const sharedFields=['description','category','composition','care','fit','details','presentation','seo','translations'] as const;
export type SharedField=typeof sharedFields[number];
export type ColourOption={id:string;product:Product;colour:string;article:string;images:string[];variants:Variant[];archived:boolean};
export type ProductGroup={id:string;parent:Product;records:Product[];colours:ColourOption[]};
export const normalizedSize=(size:string)=>size.trim().toUpperCase().replace(/^XXXL$/,'3XL').replace(/^XXL$/,'2XL');
export function rawColour(p:Product){return p.content?.trade?.colour||p.description.match(/^(black-cream|cream-black|dusty-blue|emerald green|emerald|black|cream|white|green)\b/i)?.[1].replace(/\b\w/g,c=>c.toUpperCase())||'Colour to confirm'}
const article=(p:Product)=>p.content?.trade?.supplierArticle||p.code.match(/\b\d{8}\b/)?.[0]||p.code;
const alias=(p:Product)=>p.tags.some(tag=>tag.startsWith('alias:'));
export function parentId(p:Product,catalog:Product[]):string {
 if(p.group)return p.group.id;
 const explicit=p.content?.trade?.parentProductId;
 if(explicit&&explicit!==p.id){const target=catalog.find(other=>other.id===explicit&&!alias(other));if(!target||!target.content?.trade?.parentProductId)return explicit;}
 for(const group of reviewedGroups){const i=(group.members as readonly string[]).indexOf(p.id);const parent=catalog.find(other=>other.id===group.parent);if(i>=0&&p.code.endsWith(group.articles[i])&&parent?.code.endsWith(group.articles[0]))return group.parent;}
 return p.id;
}
export function family(catalog:Product[],p:Product){const root=parentId(p,catalog);return catalog.filter(other=>!alias(other)&&parentId(other,catalog)===root)}
/** Source records remain intact. Inheritance is resolved for presentation and new order names only. */
export function sharedProducts(catalog:Product[]):Product[]{return catalog.map(p=>{
 const parent=catalog.find(other=>other.id===parentId(p,catalog));if(!parent)return p;if(parent.id===p.id)return {...p,group:{id:p.id,slug:p.slug,version:p.version}};
 const overrides=p.content?.trade?.sharedOverrides||[];const inherit=(field:SharedField)=>!overrides.includes(field);
 const content={composition:'',care:'',fit:'',details:'',...p.content};
 for(const key of ['composition','care','fit','details','presentation','translations'] as const)if(inherit(key)&&parent.content?.[key]!==undefined)(content as Record<string,unknown>)[key]=parent.content[key];
 content.trade={...p.content?.trade,colour:p.content?.trade?.colour||rawColour(p),...(inherit('seo')?{seoTitle:parent.content?.trade?.seoTitle,seoDescription:parent.content?.trade?.seoDescription}:{} )};
 return {...p,group:{id:parent.id,slug:parent.slug,version:parent.version},name:parent.name,description:inherit('description')?parent.description:p.description,category:inherit('category')?parent.category:p.category,content};
})}
export function colourOptions(catalog:Product[],p:Product,includeArchived=false):ColourOption[]{return family(catalog,p).flatMap(record=>{
 const identifiers=record.content?.trade?.identifiers||{};
 const colourKeys=[...new Set(record.variants.map(v=>identifiers[v.id]?.colourId||identifiers[v.id]?.colour||rawColour(record)))];
 const split=colourKeys.length>1;
 const options=colourKeys.map(key=>{
  const variants=record.variants.filter(v=>(identifiers[v.id]?.colourId||identifiers[v.id]?.colour||rawColour(record))===key);
  const first=variants[0],identifier=first&&identifiers[first.id];const colour=identifier?.colour||rawColour(record);
  const assigned=variants.find(v=>identifiers[v.id]?.images?.length);const images=assigned?identifiers[assigned.id].images!:record.images;
  const live=variants.filter(v=>!identifiers[v.id]?.archived);
  return {id:split?record.id+':'+key:record.id,product:record,colour,article:identifier?.supplierArticle||article(record),images,variants:includeArchived?variants:live,archived:live.length===0};
 });
 return includeArchived?options:options.filter(option=>!option.archived);
})}
export function productGroups(catalog:Product[],includeArchived=false):ProductGroup[]{const canonical=catalog.filter(p=>!alias(p)),ids=[...new Set(canonical.map(p=>parentId(p,canonical)))];return ids.map(id=>{const parent=canonical.find(p=>p.id===id)||canonical.find(p=>parentId(p,canonical)===id)!;return {id,parent,records:family(canonical,parent),colours:colourOptions(canonical,parent,includeArchived)}})}
export function groupUrl(catalog:Product[],option:ColourOption,size?:string){
 const rootId=parentId(option.product,catalog),root=catalog.find(p=>p.id===rootId)||option.product;
 if(rootId==='P001'){const params=new URLSearchParams({colour:option.colour});if(size)params.set('size',size);return '/en/products/alpin-fleece-jacket?'+params;}
 const params=new URLSearchParams();if(option.product.id!==rootId)params.set('colourId',option.product.id);if(colourOptions(catalog,option.product).filter(o=>o.product.id===option.product.id).length>1)params.set('colour',option.colour);if(size)params.set('size',size);
 return '/products/'+(root.group?.slug||root.slug)+(params.size?'?'+params:'');
}
export function optionFor(catalog:Product[],p:Product,colour?:string){return colourOptions(catalog,p).find(option=>option.product.id===p.id&&(!colour||option.colour===colour))}
