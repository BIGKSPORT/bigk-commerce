export const columns=['productCode','productId','version','variantId','gtin','sku','verified','size','colour','supplierArticle','archived','name','officialName','slug','description','category','composition','care','fit','details','originCountry','hsCode','cnCode','customsDescription','weightGrams','packageLengthCm','packageWidthCm','packageHeightCm','seoTitle','seoDescription','priceCents','stock','approved','active','images'] as const;
export const importTargets=[...columns,'priceEUR'] as const;
export type ImportTarget=typeof importTargets[number];
