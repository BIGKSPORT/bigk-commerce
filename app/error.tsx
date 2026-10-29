'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="page-container"><h1>A brief pause.</h1><p className="page-intro">We couldn’t load this page. Please try again.</p><button className="button dark" onClick={reset}>Try again</button></main>}
