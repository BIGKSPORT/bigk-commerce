export function money(cents:number){return new Intl.NumberFormat('en-BE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(cents/100)}
