export const growthSchema=`
CREATE TABLE IF NOT EXISTS newsletter_subscribers(email TEXT PRIMARY KEY,status TEXT NOT NULL CHECK(status IN ('pending','subscribed','unsubscribed')),confirm_hash TEXT UNIQUE,confirm_expires TEXT,unsubscribe_hash TEXT UNIQUE,requested_at TEXT NOT NULL,confirmed_at TEXT,unsubscribed_at TEXT,consent_version TEXT NOT NULL,consent_baseline TEXT);
CREATE TABLE IF NOT EXISTS blog_posts(id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,title TEXT NOT NULL,excerpt TEXT NOT NULL,cover_image TEXT NOT NULL,cover_alt TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),version INTEGER NOT NULL DEFAULT 0,published_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS blog_posts_public ON blog_posts(status,published_at);
`;
