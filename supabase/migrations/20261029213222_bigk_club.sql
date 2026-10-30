-- Local/staging only. Do not apply to the remote project without launch review.

CREATE TABLE IF NOT EXISTS bigk.club_members(email TEXT PRIMARY KEY,name TEXT NOT NULL,joined_at TEXT NOT NULL,state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bigk.club_orders(order_id TEXT PRIMARY KEY REFERENCES bigk.orders(id),email TEXT NOT NULL REFERENCES bigk.club_members(email),snapshot TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bigk.club_ledger(id TEXT PRIMARY KEY,email TEXT NOT NULL REFERENCES bigk.club_members(email),order_id TEXT,reason TEXT NOT NULL,points INTEGER NOT NULL,created_at TEXT NOT NULL,metadata TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS club_ledger_customer ON bigk.club_ledger(email,created_at);
CREATE INDEX IF NOT EXISTS club_orders_customer ON bigk.club_orders(email);
CREATE TABLE IF NOT EXISTS bigk.club_events(id TEXT PRIMARY KEY,config TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bigk.club_bookings(event_id TEXT NOT NULL REFERENCES bigk.club_events(id),email TEXT NOT NULL,status TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),created_at TEXT NOT NULL,PRIMARY KEY(event_id,email));
CREATE INDEX IF NOT EXISTS club_bookings_customer ON bigk.club_bookings(email);

ALTER TABLE bigk.club_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.club_members FROM PUBLIC, anon, authenticated;
ALTER TABLE bigk.club_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.club_orders FROM PUBLIC, anon, authenticated;
ALTER TABLE bigk.club_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.club_ledger FROM PUBLIC, anon, authenticated;
ALTER TABLE bigk.club_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.club_events FROM PUBLIC, anon, authenticated;
ALTER TABLE bigk.club_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.club_bookings FROM PUBLIC, anon, authenticated;
