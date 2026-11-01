export const crmSchema=`
CREATE TABLE IF NOT EXISTS crm_customers(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,profile TEXT NOT NULL,version INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS marketing_consents(id TEXT PRIMARY KEY,email TEXT NOT NULL,status TEXT NOT NULL,source TEXT NOT NULL,evidence TEXT NOT NULL,occurred_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS marketing_consents_email ON marketing_consents(email,created_at);
CREATE TABLE IF NOT EXISTS marketing_campaigns(id TEXT PRIMARY KEY,config TEXT NOT NULL,version INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
`;
