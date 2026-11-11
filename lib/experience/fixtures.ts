import type {Product} from '../types';
/** Fictional preview prices/stock, real BIG K names, photos and product URLs. Never seed a DB. */
type Fixture={id:string;name:string;slug:string;code:string;price:number;sizes:string[];colours:{name:string;image:string}[]};
const source:Fixture[]=[
 {id:'P001',name:'ALPIN FLEECE',slug:'alpin-fleece-jacket',code:'25303101',price:14690,sizes:['S','M','L','XL','2XL'],colours:[{name:'Black',image:'/products/web/alpin-fleece-pro-25303101-3.webp'},{name:'Dusty Blue',image:'/products/web/alpin-fleece-pro-25303102-3.webp'}]},
 {id:'P006',name:'ALPIN VEST',slug:'alpine-gillet-p006',code:'25303201',price:13390,sizes:['S','M','L','XL'],colours:[{name:'Beige/Black',image:'/products/web/alpin-vest-pro-bigk-alpin-vest00009.webp'}]},
 {id:'P017',name:'VELVET WMS HOOD',slug:'velvet-wms-hood-p017',code:'25000701',price:7990,sizes:['S','M','L','XL','2XL'],colours:[{name:'Black',image:'/products/web/velvet-black-front-flat.webp'},{name:'Cream',image:'/products/web/velvet-cream-front.webp'}]},
 {id:'P003',name:'CORE.2',slug:'core-2-p003',code:'25301801',price:6690,sizes:['S','M','L','XL'],colours:[{name:'Dusty Blue',image:'/products/web/core2-1u129560.webp'}]},
 {id:'P019',name:'NANO DOWN JACKET',slug:'nandown-jkt-p019',code:'25302501',price:18690,sizes:['S','M','L','XL'],colours:[{name:'Black',image:'/products/web/nano-down-jacket-1u103263.webp'}]},
 {id:'B10',name:'B10 SNEAKERS',slug:'b10-sneakers',code:'B10',price:11999,sizes:['38','39','40','41','42','43','44'],colours:[{name:'Black',image:'/products/b10/black-profile.webp'},{name:'Green',image:'/products/b10/green-profile.webp'}]},
 {id:'RIBS-LOW',name:'RIBS LOW SOCKS',slug:'ribs-low-white-socks',code:'RIBS-LOW',price:1290,sizes:['36–40','41–46'],colours:[{name:'White',image:'/products/ribs/low-white.webp'}]}
];
export function experienceFixtures():Product[]{
 return source.map(p=>{
  const rows=p.colours.flatMap((colour,c)=>p.sizes.map((size,s)=>({id:`EXPERIENCE-${p.id}-${c}-${s}`,size,stock:s===p.sizes.length-1?0:3+c,reserved:0,reported:null,colour})));
  return {id:p.id,version:0,name:p.name,slug:p.slug,code:p.code,description:'',category:p.id==='B10'?'Sneakers':p.id==='RIBS-LOW'?'Accessories':'Jackets & Vests',priceCents:p.price,approved:true,active:true,featured:false,tags:[],images:p.colours.map(c=>c.image),variants:rows.map(({colour,...v})=>v),content:{composition:'',care:'',fit:'',details:'',trade:{colour:p.colours[0].name,identifiers:Object.fromEntries(rows.map(v=>[v.id,{sku:'',gtin:'',colour:v.colour.name,images:[v.colour.image]}]))}}};
 });
}
