import { closeDatabase } from '../lib/db';
import catalog from '../lib/catalog.json';
import { audit, db, transaction } from '../lib/db';
if (process.env.COMMERCE_MODE === 'live')
    throw new Error('Review catalogue image changes in staging before updating a live store.');
let updated = 0;
const skipped: string[] = [];
(await transaction(async () => { for (const p of catalog.products) {
    const row = (await db().prepare('SELECT images,approved,active FROM products WHERE id=?').get(p.id)) as {
        images: string;
        approved: number;
        active: number;
    } | undefined;
    if (!row)
        continue;
    const images = JSON.stringify(p.images);
    if (row.images === images)
        continue;
    if (row.active || row.approved) {
        skipped.push(p.id);
        continue;
    }
    (await db().prepare('UPDATE products SET images=?,version=version+1 WHERE id=?').run(images, p.id));
    (await audit('catalog.images-synced', p.id));
    updated++;
} }));
console.log(JSON.stringify({ updated, skippedApprovedOrActive: skipped }));

await closeDatabase();
