'use client';
import {useSiteLanguage} from './site-language';
import styles from './payment-methods.module.css';
const labels={
 en:{title:'Payment options',note:'Available methods depend on your country, device and order. Payment is processed securely by Stripe.'},
 nl:{title:'Betaalmogelijkheden',note:'De beschikbare betaalmethoden hangen af van je land, apparaat en bestelling. Stripe verwerkt je betaling veilig.'},
 fr:{title:'Moyens de paiement',note:'Les moyens disponibles dépendent de votre pays, appareil et commande. Stripe traite votre paiement en toute sécurité.'},
};
export const displayedPaymentMethods=[
 {id:'visa',name:'Visa',image:'visa.svg'},
 {id:'mastercard',name:'Mastercard',image:'master.svg'},
 {id:'bancontact',name:'Bancontact',image:'bancontact.svg'},
 {id:'apple_pay',name:'Apple Pay',image:'apple_pay.svg'},
 {id:'google_pay',name:'Google Pay',image:'google_pay.svg'},
 {id:'revolut_pay',name:'Revolut Pay',image:'revolut.svg'},
 {id:'klarna',name:'Klarna',image:'klarna.svg'},
 {id:'amazon_pay',name:'Amazon Pay',image:'amazon.svg'},
 {id:'link',name:'Link',image:null},
] as const;
/** Informational badges, not payment selectors. Based on the live default Stripe configuration reviewed 2026-11-10. */
export default function PaymentMethods({placement='footer'}:{placement?:'footer'|'checkout'}){
 const {locale}=useSiteLanguage(),copy=labels[locale];
 return <section className={styles.methods+' '+(placement==='footer'?styles.footer:styles.checkout)} aria-label={copy.title} data-payment-methods={placement}>
 <p className={styles.heading}>{copy.title}</p>
 <ul className={styles.logos}>{displayedPaymentMethods.map(method=><li key={method.id} title={method.name}>{method.image?<img src={'/payments/'+method.image} alt={method.name} width={38} height={24} loading="lazy"/>:<span className={styles.link}>Link</span>}</li>)}</ul>
 <p className={styles.note}>{copy.note}</p>
 </section>;
}
