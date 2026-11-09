/** One explicit switch; preview and staging remain excluded even if flags are copied. */
export function publicIndexingEnabled(){return process.env.VERCEL_ENV!=='preview'&&process.env.DATABASE_SCHEMA!=='bigk_staging'&&process.env.INDEXING_ENABLED==='true'&&process.env.COMMERCE_MODE==='live'&&process.env.LIVE_COMMERCE_APPROVED==='true';}
export function searchVisibility(){return {enabled:publicIndexingEnabled(),requested:process.env.INDEXING_ENABLED==='true',preview:process.env.VERCEL_ENV==='preview'||process.env.DATABASE_SCHEMA==='bigk_staging'};}
