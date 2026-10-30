-- Local/staging only. No remote application in this task.

CREATE TABLE IF NOT EXISTS bigk.product_content(product_id TEXT PRIMARY KEY REFERENCES bigk.products(id),content TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bigk.admin_returns(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES bigk.orders(id),reference TEXT NOT NULL UNIQUE,request_hash TEXT NOT NULL,snapshot TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS admin_returns_order ON bigk.admin_returns(order_id);

ALTER TABLE bigk.product_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.product_content FROM PUBLIC,anon,authenticated;

ALTER TABLE bigk.admin_returns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.admin_returns FROM PUBLIC,anon,authenticated;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P001','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Teddy fleece combined with grid fleece, made from 100% polyester."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P001') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P002','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Teddy fleece combined with grid fleece, made from 100% polyester."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P002') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P003','{"composition": "92% polyamide, 8% elastane", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Quarter-zip layer in volcanic-ash fabric, made from 92% polyamide and 8% elastane."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P003') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P004','{"composition": "92% polyamide, 8% elastane", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Quarter-zip layer in volcanic-ash fabric, made from 92% polyamide and 8% elastane."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P004') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P005','{"composition": "92% polyamide, 8% elastane", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Quarter-zip layer in volcanic-ash fabric, made from 92% polyamide and 8% elastane."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P005') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P006','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle. Do not bleach or tumble dry. Check the sewn-in care label.", "fit": "", "details": "A sleeveless men’s fleece vest with a full-length zip, stand-up collar, two zipped side pockets and a zipped chest pocket. Made from 100% polyester, for everyday use and walking."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P006') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P007','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle. Do not bleach or tumble dry. Check the sewn-in care label.", "fit": "", "details": "A sleeveless men’s fleece vest with a full-length zip, stand-up collar, two zipped side pockets and a zipped chest pocket. Made from 100% polyester, for everyday use and walking."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P007') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P008','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Teddy fleece combined with grid fleece, made from 100% polyester."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P008') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P009','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Teddy fleece combined with grid fleece, made from 100% polyester."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P009') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P010','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "30D double-sided fabric combined with grid fleece. Made from 100% polyester. Fabric weight: 320 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P010') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P011','{"composition": "", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": ""}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P011') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P012','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Teddy fleece combined with grid fleece, made from 100% polyester."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P012') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P013','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Teddy fleece combined with grid fleece, made from 100% polyester."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P013') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P014','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Teddy fleece combined with grid fleece, made from 100% polyester."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P014') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P015','{"composition": "90% polyester, 10% elastane", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Single-sided grid fleece, made from 90% polyester and 10% elastane."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P015') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P016','{"composition": "90% polyester, 10% elastane", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Single-sided grid fleece, made from 90% polyester and 10% elastane."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P016') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P017','{"composition": "30% viscose, 70% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Women’s hoodie in coarse-knit, cationic-dyed brushed fabric. Made from 30% viscose and 70% polyester. Fabric weight: 320 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P017') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P018','{"composition": "30% viscose, 70% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Women’s hoodie in coarse-knit, cationic-dyed brushed fabric. Made from 30% viscose and 70% polyester. Fabric weight: 320 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P018') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P019','{"composition": "Outer fabric: 98% polyamide (nylon), 2% polyester. Filling: approximately 90% white goose down, according to the supplier; the remaining filling composition is not specified.", "care": "Wash at 30°C on a gentle cycle. Supplier’s detailed care note: wash inside out and separately; do not bleach, tumble dry or dry clean. Check the sewn-in care label.", "fit": "Regular fit is listed for S–2XL. Down filling weight by size: S 80 g, M 85 g, L 90 g, XL 95 g, 2XL 100 g, 3XL 105 g. These are filling weights, not the total weight of the jacket.", "details": "A lightweight padded men’s winter jacket with a black outer fabric, zip fastening and concealed zipped pockets. According to the supplier, the filling contains approximately 90% white goose down. The wind-resistant, water-repellent outer fabric helps protect against cold wind and light rain. Designed for everyday use and walking. Autumn/Winter 2026 collection. Water-repellent does not mean waterproof."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P019') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P020','{"composition": "Outer fabric: 98% polyamide (nylon), 2% polyester. Filling: approximately 90% white goose down, according to the supplier; the remaining filling composition is not specified.", "care": "Wash at 30°C on a gentle cycle. Supplier’s detailed care note: wash inside out and separately; do not bleach, tumble dry or dry clean. Check the sewn-in care label.", "fit": "Regular fit is listed for S–2XL. Down filling weight by size: S 80 g, M 85 g, L 90 g, XL 95 g, 2XL 100 g, 3XL 105 g. These are filling weights, not the total weight of the jacket.", "details": "A lightweight padded men’s winter jacket with a black outer fabric, zip fastening and concealed zipped pockets. According to the supplier, the filling contains approximately 90% white goose down. The wind-resistant, water-repellent outer fabric helps protect against cold wind and light rain. Designed for everyday use and walking. Autumn/Winter 2026 collection. Water-repellent does not mean waterproof."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P020') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P021','{"composition": "98% polyamide, 2% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Sleeveless vest in fabric made from 98% polyamide and 2% polyester. The supplier identifies the fabric as graphene fabric; no thermal or waterproof performance rating is supplied."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P021') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P022','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Four-way stretch, TPV and fleece with ultrasonic perforations. Made from 100% polyester. Fabric weight: 340 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P022') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P023','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "One size.", "details": "One-size scarf in 100% polyester. Soft teddy fleece combined with grid fleece. Fabric weight: 480 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P023') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P024','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "One size.", "details": "One-size scarf in 100% polyester. Soft teddy fleece combined with grid fleece. Fabric weight: 480 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P024') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P025','{"composition": "100% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "One size.", "details": "One-size scarf in 100% polyester. Soft teddy fleece combined with grid fleece. Fabric weight: 480 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P025') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P026','{"composition": "30% viscose, 70% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Women’s hoodie in coarse-knit, cationic-dyed brushed fabric. Made from 30% viscose and 70% polyester. Fabric weight: 320 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P026') ON CONFLICT(product_id) DO NOTHING;

INSERT INTO bigk.product_content(product_id,content) SELECT 'P027','{"composition": "30% viscose, 70% polyester", "care": "Wash at 30°C on a gentle cycle.", "fit": "", "details": "Women’s hoodie in coarse-knit, cationic-dyed brushed fabric. Made from 30% viscose and 70% polyester. Fabric weight: 320 g/m²."}' WHERE EXISTS(SELECT 1 FROM bigk.products WHERE id='P027') ON CONFLICT(product_id) DO NOTHING;
