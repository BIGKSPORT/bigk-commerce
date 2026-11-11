/** Transactional interface text. Never translate source product names or identifiers. */
export type OrderEmailLanguage='en'|'nl'|'fr'|'es'|'it';
export function orderEmailLanguage(value:unknown):OrderEmailLanguage{return value==='nl'||value==='fr'||value==='es'||value==='it'?value:'en'}
const en={confirmation:'Your BigK order is confirmed',shipment:'Your BigK order is on its way',order:'Order',discount:'BigK Club discount',subtotal:'Subtotal',delivery:'Delivery',total:'Total',tracking:'Tracking reference',history:'View your order history',track:'Track your parcel',account:'View your account',vat:'VAT',country:'Belgium'};
export const orderEmailCopy:Record<OrderEmailLanguage,typeof en>={
 en,
 es:{confirmation:'Tu pedido BigK está confirmado',shipment:'Tu pedido BigK está en camino',order:'Pedido',discount:'Descuento BigK Club',subtotal:'Subtotal',delivery:'Envío',total:'Total',tracking:'Referencia de seguimiento',history:'Ver tu historial de pedidos',track:'Seguir tu paquete',account:'Ver tu cuenta',vat:'IVA',country:'Bélgica'},
 it:{confirmation:'Il tuo ordine BigK è confermato',shipment:'Il tuo ordine BigK è in viaggio',order:'Ordine',discount:'Sconto BigK Club',subtotal:'Subtotale',delivery:'Consegna',total:'Totale',tracking:'Riferimento di tracciamento',history:'Vedi la cronologia degli ordini',track:'Traccia il tuo pacco',account:'Vedi il tuo account',vat:'IVA',country:'Belgio'},
 nl:{confirmation:'Je BigK-bestelling is bevestigd',shipment:'Je BigK-bestelling is onderweg',order:'Bestelling',discount:'BigK Club-korting',subtotal:'Subtotaal',delivery:'Bezorging',total:'Totaal',tracking:'Trackingnummer',history:'Bekijk je bestelgeschiedenis',track:'Volg je pakket',account:'Bekijk je account',vat:'Btw',country:'België'},
 fr:{confirmation:'Votre commande BigK est confirmée',shipment:'Votre commande BigK est en route',order:'Commande',discount:'Réduction BigK Club',subtotal:'Sous-total',delivery:'Livraison',total:'Total',tracking:'Référence de suivi',history:'Consultez votre historique de commandes',track:'Suivre votre colis',account:'Consulter votre compte',vat:'TVA',country:'Belgique'}
};

