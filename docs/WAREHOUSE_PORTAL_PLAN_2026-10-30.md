# BIG K ® Warehouse Portal — functioneel ontwerp (30 oktober 2026)
**Status:** ontwikkelplan + zuivere inspectielogica; de aparte login/rol en fysieke warehouse-UI zijn **nog niet operationeel**.

## Gebruikers en rechten
- `warehouse_picker`: alleen toegewezen pick/packorders lezen, SKU/barcode/maat scannen, pakketgewicht en afmeting registreren, verzendklaar melden.
- `warehouse_returns`: toegewezen retouraanvragen lezen, ontvangst registreren, exacte SKU+maat+aantal scannen, foto, productconditie, locatie, inspectie-uitkomst registreren; geen refunds/labelorders.
- `warehouse_lead`: tweede controle, voorraadverschillen beoordelen en goederen naar verkoopbaar/quarantaine/defect classificeren, na transactiecontrole.
- `admin` / klantenservice: alleen zij beheren klantcontact, beleidsuitzonderingen, financiële terugbetalingen en bestellingen. Roltoewijzing moet server-side gebeuren met individuele accounts en auditlog; **het bestaande systeem kent alleen een gedeelde adminsessie**, dus nooit de warehouseportal op alleen browsermenuverberging baseren.
- Persoonsgegevens minimaliseren: voor warehouse alleen noodzakelijke afleveradresdetails bij pack/ship; geen betaalgegevens, marketingdata, klantgeschiedenis of volledige administratie.

## Werkrijen
1. **Te picken:** betaalde, nog niet geannuleerde en niet geblokkeerde orders; FIFO of prioriteit. Per product: naam, SKU, maat, kleur, aantal, voorraadlocatie.
2. **Te verpakken:** scan alle artikelen, extra controle op verkeerde maat of variant, pakbon, pakketgewicht/afmetingen, labelstatus.
3. **Wacht op vervoerder:** pas na geldige carrierlabel en pickup; scan overdracht en bewijs. Nooit order 'verzonden' bij enkel labelaanmaak.
4. **Retour onderweg:** alleen geautoriseerde retourcodes en tracking; status niet 'ontvangen' door klantmelding.
5. **Retour ontvangen:** scant retourcode, originele SKU/maat/aantal; foto en conditie; registreren.
6. **Inspectie/uitzonderingen:** verkeerd artikel, aantalverschil, schade, hygiëne, eiland/verzendverschil, ontbrekende goedkeuring.
7. **Omruiling klaarzetten:** originele retour fysiek gecontroleerd, nieuwe maat beschikbaar en gereserveerd via transactionele voorraadcontrole; vervolgens pas carrierlabel en dispatch. Bij maat ontbreekt blijft aanvraag bij support.

## Workflow: maat M te klein, maat L gewenst
- Customer Service Agent verifieert betaald order, vraagt maat L en bevestigt retourinstructies. Geen belofte dat voorraad definitief gereserveerd is.
- Warehouse ziet een retourtaak, scant retourlabel/reference, checkt of maat M daadwerkelijk terug is en conditioneel verkoopbaar.
- Warehouse bevestigt **fysieke feiten**, niet wettelijke toelaatbaarheid of refundbesluit.
- Een apart autorisatiemechanisme mag pas na magazijncheck een maat-L picktaak openen; geen autonoom refund of dubbele vrije verzending.
- Customer Service Agent krijgt status `received` / `inspected` / `replacement_preparing` / `shipped` en maakt klantupdates.
- Binnen BE/NL/LU/DE/FR één kosteloze nieuwe standaardlevering alleen na remote-postcodecontrole en gecontroleerde eenmalige aanspraak. Eilanden en afwijkende postcodes handmatig behandelen.

## Technische eisen
- Echte `warehouse_users` / RBAC en server-side route-guards, gescheiden van `requireAdmin`. Geen gedeeld adminwachtwoord voor magazijn.
- Database `warehouse_tasks`, `warehouse_task_events`, `warehouse_locations`, `warehouse_inspections`, `exchange_cases`; migraties staging eerst. Elke mutatie met idempotency key en transacties, audit wie/wanneer, geen dubbele voorraad.
- Lager beveiligde warehouse login mag nooit toegang krijgen tot `/api/admin/returns` om financiële terugbetalingen te registreren.
- Server valideert alle barcode-, aantallen- en SKU-gegevens tegen gekende orderregels. Retourcontrole is niet hetzelfde als automatische terugboeking van voorraad.
- Gebeurtenissen naar klantenservice via gecontroleerde outbox, **geen** rechtstreekse automatische e-mail zonder geconfigureerde toestemming.
- Mobielvriendelijke UI en handscanner/telefooncamera als toekomstige input; geen ongeteste claim dat barcode-scanning reeds werkt.

## Al toegevoegd aan draft
- `lib/warehouse-inspection.ts`: zuivere inspectiecontrole, levert alleen `eligible_for_restock_review`, `hold_for_review` of `mismatch_investigation`, nooit permissie om automatisch verzenden, restock of terugbetalen te doen.
- `tests/warehouse-inspection.test.ts`: zes gerichte tests voor aantallen, verkeerde SKU, schade, foto's en handmatige vrijgave.
- Testen nog niet uitgevoerd; geen warehouseportaal of aparte warehouseaccounts geactiveerd.

## Prioriteit
1. RBAC/individuele magazijnaccounts en scheiding van admin;
2. Warehouse datamodel / stagingmigraties;
3. Mobiel portaal met taaklijsten en auditbare ontvangst/inspectie;
4. Retour→maatruil eventkoppeling met klantenservice;
5. Pick/pack en labels via MyParcel/DPD na accountverificatie;
6. Stagingtests met echte barcode en magazijnmedewerker; daarna gecontroleerd live.

Geen live voorraadupdates, billable shipping labels of klantenmails op basis van dit ontwerp.
