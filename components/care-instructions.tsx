import type {Locale} from '@/lib/i18n/config';
import {careCopy,careSymbols,type CareSymbol} from '@/lib/i18n/care';
import styles from './care-instructions.module.css';
/** Language-independent vector pictograms. One-dot iron and square/circle dryer
 * correct the owner's reference artwork to match the explicitly approved wording. */
export function CarePictogram({symbol}:{symbol:CareSymbol}) {
 return <svg className={styles.icon} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-care-symbol={symbol}>
 <rect x="7" y="7" width="106" height="106" rx="16"/>
 {symbol==='wash-30'&&<><path d="M23 28 33 94h54l10-66M27 46h66"/><text x="60" y="82" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Arial, Helvetica, sans-serif" fontSize="30" fontWeight="700">30</text></>}
 {symbol==='similar-colours'&&<><path d="m42 34-13 5-12 17 12 9 8-8v37h42V57l8 8 12-10-14-16-13-5c-3 13-24 13-30 0Z"/><path d="m49 27 12-4 12 5M87 31l8 3 13 17-5 10"/></>}
 {symbol==='no-bleach'&&<><path d="m60 25 36 64H24Z"/><path d="m23 23 74 74m0-74L23 97"/></>}
 {symbol==='iron-low'&&<><path d="M39 32h29c12 0 17 7 20 19l12 38H20c7-18 18-27 35-27h36"/><circle cx="59" cy="77" r="2.5" fill="currentColor" stroke="none" data-iron-dot/></>}
 {symbol==='no-tumble-dry'&&<><rect x="24" y="24" width="72" height="72" rx="1" data-dryer-square/><circle cx="60" cy="60" r="29"/><path d="m20 20 80 80m0-80-80 80"/></>}
 </svg>;
}
export default function CareInstructions({locale='en',compact=false,id}:{locale?:Locale;compact?:boolean;id?:string}) {
 const copy=careCopy[locale],Heading=compact?'h3':'h2';
 return <section id={id} className={styles.section+(compact?' '+styles.compact:'')} aria-label={copy.heading} data-care-instructions data-care-locale={locale}>
 <Heading>{copy.heading}</Heading><ul className={styles.items}>{careSymbols.map(symbol=><li key={symbol}><CarePictogram symbol={symbol}/><p>{copy.instructions[symbol]}</p></li>)}</ul><p className={styles.advice}>{copy.advice}</p>
 </section>;
}
