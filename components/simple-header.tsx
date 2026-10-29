import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Brand } from './brand';
export function SimpleHeader(){return <header className="simple-header"><Brand/><Link href="/"><ArrowLeft size={14}/> Back to collection</Link></header>}
