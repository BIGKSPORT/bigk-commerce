/** Transactional interface text. Never translate source product names or identifiers. */
export type OrderEmailLanguage='en'|'nl'|'fr';
export function orderEmailLanguage(value:unknown):OrderEmailLanguage{return value==='nl'||value==='fr'?value:'en'}
const en={confirmation:'Your BigK order is confirmed',shipment:'Your BigK order is on its way',order:'Order',discount:'BigK Club discount',subtotal:'Subtotal',delivery:'Delivery',total:'Total',tracking:'Tracking reference',history:'View your order history',track:'Track your parcel',account:'View your account',vat:'VAT',country:'Belgium'};
export const orderEmailCopy:Record<OrderEmailLanguage,typeof en>={
 en,
 nl:{confirmation:'Je BigK-bestelling is bevestigd',shipment:'Je BigK-bestelling is onderweg',order:'Bestelling',discount:'BigK Club-korting',subtotal:'Subtotaal',delivery:'Bezorging',total:'Totaal',tracking:'Trackingnummer',history:'Bekijk je bestelgeschiedenis',track:'Volg je pakket',account:'Bekijk je account',vat:'Btw',country:'België'},
 fr:{confirmation:'Votre commande BigK est confirmée',shipment:'Votre commande BigK est en route',order:'Commande',discount:'Réduction BigK Club',subtotal:'Sous-total',delivery:'Livraison',total:'Total',tracking:'Référence de suivi',history:'Consultez votre historique de commandes',track:'Suivre votre colis',account:'Consulter votre compte',vat:'TVA',country:'Belgique'}
};
