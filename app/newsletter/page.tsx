import {SimpleHeader} from '@/components/simple-header';import {Footer} from '@/components/brand';import NewsletterSignup from '@/components/newsletter-signup';import {getSiteLanguage} from '@/lib/i18n/site-server';
export async function generateMetadata(){const {t}=await getSiteLanguage();return {title:t('Join the BIG K newsletter'),description:t('Collection stories, product news and updates from BIG K. Confirm your email to join.')}}
export default function Newsletter(){return <><SimpleHeader/><main className="page-container"><NewsletterSignup/></main><Footer newsletter={false}/></>}
