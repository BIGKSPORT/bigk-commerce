'use client';
export default function PrintButton({label='Print packing slip'}:{label?:string}){return <button className="button dark packing-print-button" onClick={async()=>{await Promise.all(Array.from(document.images).map(image=>image.decode().catch(()=>{})));await document.fonts.ready;window.print();}}>{label}</button>;}
