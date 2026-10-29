import Link from 'next/link';
import { SimpleHeader } from '@/components/simple-header';
export default function NotFound(){return <><SimpleHeader/><main id="main" className="page-container"><span className="eyebrow">A DIFFERENT DIRECTION</span><h1>This page has moved on.</h1><p className="page-intro">We couldn’t find that page. There’s more to explore in the collection.</p><Link className="button dark" href="/">Back to BigK →</Link></main></>}
