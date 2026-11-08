/** Content can be prepared before public routes are activated in the multilingual phase. */
export const catalogLocales=['en','nl','fr','de','it','es'] as const;
export type CatalogLocale=typeof catalogLocales[number];
export const catalogLanguageNames:Record<CatalogLocale,string>={en:'English',nl:'Nederlands',fr:'Français',de:'Deutsch',it:'Italiano',es:'Español'};
