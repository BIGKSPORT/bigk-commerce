'use client';
import {useEffect,useState} from 'react';
import type {AdminTransport} from './admin-types';
import type {FeedIssue} from '@/lib/catalogue-feed';
type Report={styles:number;publicRecords:number;variants:number;eligible:number;drafts:number;issues:FeedIssue[];page:number;pages:number;totalIssues:number;publicLanguages:string[];editorLanguages:string[];checkoutCountries:string[];feedsEnabled:boolean;links:{google:string|null;meta:string|null}|null;notes:string[]};
export default function AdminCatalogueReadiness({transport}:{transport:AdminTransport}){
 const [page,setPage]=useState(1),[loading,setLoading]=useState(false);
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState('');
 async function load(){setError('');setLoading(true);try{setReport(await transport.request('/api/admin/catalogue-readiness?page='+page,{cache:'no-store',signal:AbortSignal.timeout(15000)}))}catch(e){setError((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{void load()},[transport,page]);
 return <section className="bo-panel"><div className="bo-panel-heading"><h2>Search and product-feed readiness</h2><button className="text-button" disabled={loading} onClick={()=>void load()}>Refresh readiness</button></div>{error&&<p role="alert">{error}</p>}{!report&&!error&&<p role="status">Checking the saved catalogue…</p>}{report&&<>
 <p>{report.styles} public styles · {report.eligible} / {report.variants} variants eligible for export · {report.drafts} unpublished records retained.</p>
 <p>Public languages: {report.publicLanguages.join(', ')}. Editor languages: {report.editorLanguages.join(', ')}. Checkout countries: {report.checkoutCountries.join(', ')}.</p>
 <p>Open Products → Edit shared product → English → Product-feed attributes. Confirm gender, age group and condition. For GTIN, colour photos or price, edit the relevant colour record. Nothing is filled with invented values.</p>
 {report.links?<details><summary>Private product-feed URLs</summary><p>Keep these bearer links private. Paste the Google URL into Merchant Center. Validate the Meta CSV in Commerce Manager before advertising. They contain public product data only.</p>{(['google','meta'] as const).map(vendor=><label className="field" key={vendor}>{vendor==='google'?'Google XML':'Meta CSV draft'}<input aria-label={vendor+' product feed URL'} readOnly value={report.links?.[vendor]||'Feed signing is not configured'} onFocus={event=>event.target.select()}/></label>)}</details>:<p>Feeds are unavailable in preview/staging or when PRODUCT_FEEDS_ENABLED=false. Draft diagnostics still work.</p>}
 <details open={report.issues.length>0}><summary>{report.totalIssues} variants need product data</summary><div className="table-scroll" style={{maxHeight:400,overflow:'auto'}}><table className="admin-table"><thead><tr><th>Product</th><th>Variant</th><th>Missing or invalid</th></tr></thead><tbody>{report.issues.map(issue=><tr key={issue.variantId}><td>{issue.name}<small>{issue.productId} / {issue.sourceId}</small></td><td>{issue.variantId}<small>{issue.size}</small></td><td>{issue.missing.join(', ')}</td></tr>)}</tbody></table></div><div className="bo-inline-actions"><button className="text-button" disabled={loading||report.page<=1} onClick={()=>setPage(report.page-1)}>Previous readiness page</button><span>Page {report.page} of {report.pages}</span><button className="text-button" disabled={loading||report.page>=report.pages} onClick={()=>setPage(report.page+1)}>Next readiness page</button></div></details>
 <ul>{report.notes.map(note=><li key={note}>{note}</li>)}</ul>
 </>}</section>;
}
