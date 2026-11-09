import type {CatalogLocale} from './i18n/catalog-locales';
export type CategoryLabels=Partial<Record<CatalogLocale,string>>;
/** Sportswear terms, not machine-generated product specifications. */
export const defaultCategoryLabels:Record<string,CategoryLabels>={
 'Jackets & Vests':{en:'Jackets & Vests',nl:'Jassen & bodywarmers',fr:'Vestes & gilets',de:'Jacken & Westen',it:'Giacche & gilet',es:'Chaquetas & chalecos'},
 Fleece:{en:'Fleece',nl:'Fleece',fr:'Polaires',de:'Fleece',it:'Pile',es:'Forros polares'},
 Pants:{en:'Pants',nl:'Broeken',fr:'Pantalons',de:'Hosen',it:'Pantaloni',es:'Pantalones'},
 Accessories:{en:'Accessories',nl:'Accessoires',fr:'Accessoires',de:'Accessoires',it:'Accessori',es:'Accesorios'},
 Sneakers:{en:'Sneakers',nl:'Sneakers',fr:'Baskets',de:'Sneaker',it:'Sneakers',es:'Zapatillas'},
 Other:{en:'Other',nl:'Overige',fr:'Autres',de:'Sonstiges',it:'Altro',es:'Otros'},
 'Long sleeves':{en:'Long-sleeve tops',nl:'Shirts met lange mouwen',fr:'Hauts à manches longues',de:'Langarmshirts',it:'Maglie a maniche lunghe',es:'Camisetas de manga larga'},
 Thermal:{en:'Thermal layers',nl:'Thermokleding',fr:'Vêtements thermiques',de:'Thermobekleidung',it:'Abbigliamento termico',es:'Ropa térmica'},
};
export type CategoryOption={name:string;labels:CategoryLabels};
export function categoryLabel(name:string,locale:string,labels?:CategoryLabels){const source=labels??defaultCategoryLabels[name];return source?.[locale as CatalogLocale]?.trim()||source?.en?.trim()||name;}
