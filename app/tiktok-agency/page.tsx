import Image from 'next/image';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { salesCatalogueData } from '@/lib/sales-service';
import { cookieValue, hash, HttpError, requireAdmin } from '@/lib/security';
import styles from '@/components/sales-workspace.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'BIG K | TikTok agency catalogue', robots: { index: false, follow: false } };

const money = new Intl.NumberFormat('en-BE', { style: 'currency', currency: 'EUR' });
const fobCny: Readonly<Record<string, number>> = {
  '25000701': 135, '25000702': 135, '25000703': 133, '25000704': 133,
  '25300801': 112, '25301601': 130, '25301603': 130, '25301701': 110, '25301702': 110,
  '25301801': 80, '25301802': 80, '25301803': 80, '25301902': 68, '25301903': 68,
  '25302101': 142, '25302401': 42, '25302402': 42, '25302403': 42, '25302701': 118,
  '25302901': 468, '25303001': 364, '25303101': 151, '25303102': 151, '25303201': 132, '25303202': 132,
};

async function mayViewCatalogue() {
  const request = new Request('https://bigk.be/tiktok-agency', { headers: await headers() });
  try {
    await requireAdmin(request);
    return true;
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 401) throw error;
  }

  const email = process.env.TIKTOK_AGENCY_EMAIL?.trim().toLowerCase();
  const session = cookieValue(request, 'bigk_customer');
  if (!email || !session) return false;

  const account = await db().prepare(
    'SELECT email FROM customer_sessions WHERE hash=? AND expires_at>? AND LOWER(email)=?'
  ).get(hash(session), new Date().toISOString(), email);
  return Boolean(account);
}

export default async function TikTokAgencyCatalogue() {
  if (!(await mayViewCatalogue())) {
    return <main id="main" className="page-container">
      <h1>TikTok agency catalogue</h1>
      <p>Sign in using your approved agency email address, then reopen this page.</p>
      <a className="button dark" href="/en/account">Sign in to BIG K</a>
    </main>;
  }

  const { catalogue, models } = await salesCatalogueData();
  const byId = new Map(catalogue.map(variant => [variant.id, variant]));
  const categories = [...new Set(models.map(model => model.categoryLabel))];

  return <main id="main" className="page-container">
    <h1>BIG K TikTok agency catalogue</h1>
    <p>Estimated landed cost is 20% of VAT-inclusive retail. Distributor prices use factor 2.50, or 2.20 for footwear.</p>
    <nav aria-label="Product categories">
      {categories.map((category, index) => <a className={styles.secondary} key={category} href={'#category-' + index}>{category}</a>)}
    </nav>
    {categories.map((category, index) => <section key={category} id={'category-' + index}>
      <h2>{category}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
        {models.filter(model => model.categoryLabel === category).map(model => <article key={model.id} className={styles.catalogueCard}>
          {model.colours[0]?.images[0] && <div className={styles.photoButton}>
            <Image src={model.colours[0].images[0]} alt={model.name + ' · ' + model.colours[0].name} width={480} height={560} sizes="(max-width: 740px) 95vw, (max-width: 1120px) 48vw, 380px" />
          </div>}
          <div className={styles.catalogueBody}>
            <h3>{model.name}</h3>
            <p>{model.description}</p>
            {model.introduction && model.introduction !== model.description && <p>{model.introduction}</p>}
            {model.colours.map(colour => {
              const variants = colour.variantIds.flatMap(id => {
                const variant = byId.get(id);
                return variant ? [variant] : [];
              });
              const first = variants[0];
              if (!first) return null;
              const articleNumber = first.code.match(/\d{8}$/)?.[0] ?? '';
              const fob = fobCny[articleNumber];
              return <section key={colour.id}>
                <h4>{colour.name} · {colour.article}</h4>
                <div className={styles.priceOverview}>
                  <div><span>Retail incl. VAT</span><strong>{money.format(first.retailCents / 100)}</strong></div>
                  <div><span>Distributor excl. VAT</span><strong>{money.format(Math.round(first.retailCents / (first.footwear ? 2.2 : 2.5)) / 100)}</strong></div>
                  <div><span>Estimated landed cost</span><strong>{money.format(Math.round(first.retailCents / 5) / 100)}</strong></div>
                </div>
                {fob !== undefined && <p>FOB · CNY {fob}</p>}
                <details>
                  <summary>Sizes, stock and photos</summary>
                  <ul>{variants.map(variant => <li key={variant.id}>{variant.size} · {variant.available} available</li>)}</ul>
                  {colour.images.map((src, i) => <Image key={src + i} src={src} alt={model.name + ' · ' + colour.name + ' · photo ' + (i + 1)} width={160} height={180} sizes="160px" style={{ objectFit: 'contain' }} />)}
                </details>
              </section>;
            })}
            <details>
              <summary>Product specifications and size guide</summary>
              <dl className={styles.specifications}>
                {Object.entries({ Composition: model.composition, Fit: model.fit, Care: model.care, Details: model.details, 'Size guide': model.sizeGuide })
                  .filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
              {model.sizeTable.trim() && <div className={styles.matrixScroll}>
                <table className={styles.variantMatrix}><tbody>{model.sizeTable.trim().split(/\r?\n/).map((row, i) =>
                  <tr key={i}>{row.split('\t').map((cell, j) => i === 0 ? <th key={j} scope="col">{cell}</th> : <td key={j}>{cell}</td>)}</tr>
                )}</tbody></table>
              </div>}
              {model.features.map(feature => <section key={feature.id}>
                <h4>{feature.heading}</h4><p>{feature.description}</p>
                {feature.image && <Image src={feature.image} alt={feature.alt || feature.heading} width={400} height={280} sizes="(max-width: 480px) 80vw, 400px" style={{ maxWidth: '100%', height: 'auto' }} />}
              </section>)}
            </details>
          </div>
        </article>)}
      </div>
    </section>)}
  </main>;
}
