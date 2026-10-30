// Used only by the local SQLite adapter. PostgreSQL uses the reviewed migration.
export const clubSchema=`
CREATE TABLE IF NOT EXISTS club_members(email TEXT PRIMARY KEY,name TEXT NOT NULL,joined_at TEXT NOT NULL,state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS club_orders(order_id TEXT PRIMARY KEY REFERENCES orders(id),email TEXT NOT NULL REFERENCES club_members(email),snapshot TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS club_ledger(id TEXT PRIMARY KEY,email TEXT NOT NULL REFERENCES club_members(email),order_id TEXT,reason TEXT NOT NULL,points INTEGER NOT NULL,created_at TEXT NOT NULL,metadata TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS club_ledger_customer ON club_ledger(email,created_at);
CREATE INDEX IF NOT EXISTS club_orders_customer ON club_orders(email);
CREATE TABLE IF NOT EXISTS club_events(id TEXT PRIMARY KEY,config TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS club_bookings(event_id TEXT NOT NULL REFERENCES club_events(id),email TEXT NOT NULL,status TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),created_at TEXT NOT NULL,PRIMARY KEY(event_id,email));
CREATE INDEX IF NOT EXISTS club_bookings_customer ON club_bookings(email);
`;
