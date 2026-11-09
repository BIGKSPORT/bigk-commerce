import type {Merchandising,MerchCopy} from './merchandising-content';
import type {CatalogLocale} from './i18n/catalog-locales';
/** Browser-safe: schema validation and all database code stay out of the storefront bundle. */
export function merchandisingCopy(copy:Merchandising['hero']['copy'],locale:CatalogLocale):MerchCopy{return {eyebrow:copy[locale]?.eyebrow||copy.en.eyebrow,title:copy[locale]?.title||copy.en.title,description:copy[locale]?.description||copy.en.description,button:copy[locale]?.button||copy.en.button,alt:copy[locale]?.alt||copy.en.alt};}
export const merchandisingUI={en:{organized:'Explore by category. Choose your colour and size.',shop:'Shop the look',choose:'Choose size',all:'Browse all products',collection:'Explore the collection'},nl:{organized:'Ontdek per categorie. Kies je kleur en maat.',shop:'Shop de look',choose:'Kies je maat',all:'Bekijk alle producten',collection:'Ontdek de collectie'},fr:{organized:'Explorez par catégorie. Choisissez votre couleur et votre taille.',shop:'Acheter ce look',choose:'Choisir la taille',all:'Voir tous les produits',collection:'Découvrir la collection'}};

export const catalogueOverviewCopy={
 en:{intro:'Discover a selection of styles in each category. Open a category to see every style and colour.',category:'View category',all:'View all styles and colours'},
 nl:{intro:'Ontdek enkele modellen per categorie. Open een categorie voor alle modellen en kleuren.',category:'Bekijk categorie',all:'Bekijk alle modellen en kleuren'},
 fr:{intro:'Découvrez une sélection de modèles par catégorie. Ouvrez une catégorie pour voir tous les modèles et coloris.',category:'Voir la catégorie',all:'Voir tous les modèles et coloris'},
};
