# BIG K ® — Europees verzend- en gratisverzendplan (concept)
**Datum:** 30 oktober 2026  
**Status:** **ADVIES / NIET LIVE / NIET GOEDGEKEURD**  
**Productkost-aanname van eigenaar:** inkoop = **30% van MRP** (adviesverkoopprijs). Alle voorbeelden hieronder rekenen voorlopig met **MRP incl. 21% btw** en inkoop van 30% van die MRP. Landafhankelijke btw, prijzen na korting en retouren kunnen resultaten veranderen.

## 1. De echte economische ruimte voor gratis verzending
Voorbeeld bij MRP €100 incl. 21% btw: omzet excl. btw = €82,64; inkoop bij 30% MRP = €30,00; over vóór transport, verpakking, betaalkosten, marketing, operationele kosten en retouren = **€52,64**. Dit is **52,64% van de consumenten-MRP**, niet 70% nettowinst.
- Alle gratisverzenddrempels gelden op **besteltotaal na productkortingen**, vóór verzendkosten, en niet op theoretische MRP.
- Bij 20% promotiekorting daalt een product met MRP €100 naar €80 incl. btw: netto omzet circa €66,12, terwijl de inkoop bij €30 blijft; beschikbare bijdrage daalt naar €36,12 vóór shipping/overhead.
- Als MRP of kostgrondslag anders wordt gedefinieerd, de hele marge opnieuw berekenen.
- Geen gratis verzending naar remote areas / eilandpostcodes zonder aparte verificatie en plafond.
- Btw- en brandstofcomponenten apart modelleren; echte vervoerskost moet zijn **basistarief + actuele brandstof + postcode/toeslagen + retourreserve**. Gebruik geen directe DPD- en MyParcel-prijzen door elkaar.

## 2. Voorlopig B2C-beleid (euro's; KLANTVERZENDTARIEVEN incl. btw als indicatieve consumentenprijzen)
| Zone | Landcodes | Standaard verzendbijdrage van klant | Gratis standaard thuislevering vanaf |
|---|---|---:|---:|
| A België | BE | €5,95 | **€79** |
| B Buurlanden | NL, LU, DE | €6,95 | **€99** |
| C Frankrijk | FR | €8,95 | **€109** |
| D nabij / Centraal-Europa | AT, PL, CZ, HU, SK, SI, HR | €9,95 | **€129** |
| E Zuid- en Noord-Europa | ES, IT, PT, DK, SE, IE | €11,95 | **€159** |
| F Oost-Europa/Baltisch | BG, RO, EE, LT, LV | €14,95 | **€179** |
| G verre / dure landen | FI, GR | €18,95 | **€199** |
| H Niet-EU en andere landen | GB, CH, NO, IS, RS, BA, UA en alle overige niet uitdrukkelijk toegelaten landen | **GEEN ONLINE CHECKOUT BIJ LANCERING** | **geen gratis verzending** |

**Deze landenlijst is commercieel advies, geen bewijs van beschikbaarheid bij DPD/MyParcel of ondersteunde betaal-, belasting- en douanediensten.** Landen zijn pas activeerbaar nadat de verzekerde dienst, contractstatus, betaalregels, postcodes en carrier-route getest zijn.

### Waarom deze drempels?
MyParcel hoogste EU Home staffel 2026 toont bijvoorbeeld NL €7,07, DE €7,12, FR €8,66, ES €11,08, IT €11,19, FI €19,04 en GR €25,27 **excl. brandstof/btw**. Directe DPD B2C-offerte uit maart heeft andere tarieven; vergelijk per dienst. De gekozen drempels beschermen het vaste transportsubsidiebudget, sturen klanten naar 2+ artikelen, en houden high-cost bestemmingen hoger. Ze zijn **geen finale margeberekening** zonder gemiddelde orderwaarde, productgewicht, verpakkingskost, echte btw en retourpercentage.

## 3. Eiland- en postcodebeleid (verplicht)
*Bron: MyParcel `DPD_Tarieven_2026_NL.pdf`, p.19, remote postcode lijst; raadpleeg de **oorspronkelijke exacte postcode-reeksen**.*
- Remote-area toeslag is **additioneel** bovenop basisverzendtarief, niet vervangend. Voorbeelden uit prijslijst: NL €12,76, DE €14,36, FR €33,51, ES €31,90, IT €33,51, PT €51,03, GR €23,05, HR €40,36, FI €67,16. Alle bedragen zijn ex btw en excl. variabele brandstof.
- **Eiland of afgelegen postcode = standaard géén gratis verzending**, ook bij bestellingen boven drempel. Laat eerst exacte postcode en postcodegebied/match valideren; toon **aparte transparante eilandtoeslag** of `Offerte aanvragen` vóór betaling. Nooit stille checkout bij ontbrekende of onduidelijke zone.
- Externe overzeese gebieden (o.a. bepaalde Spaanse, Franse, Portugese gebieden) kunnen een ander btw-/douaneregime hebben, ook als ze bij een Europees land horen. Niet automatisch gelijkstellen aan het vasteland.
- Postcode dient bij checkout eerst genormaliseerd (spaties, letters, voorloopnullen, landformaat) en tegen het **actuele** vervoerdersbestand gecontroleerd te worden.
- Landen met verkeerde of onvolledige postcode-overzichten in de brochure worden **handmatig bevestigd** vóór commerciële vrijgave.
- **Geen automatische toeslagbedragen op basis van alleen land**: de meeste postcodes vallen onder normaal tarief.

## 4. Regels voor retours
- Vrijwillige winkelretour: **niet automatisch gratis**; openbaar retourbeleid en wettelijke consumentenrechten eerst laten controleren.
- Bij defect, verkeerde levering of overige wettelijke verkopersverplichtingen zijn aparte merchant-funded processen nodig.
- MyParcel DPD Shop Return (0–20kg) historische **basisprijzen excl. btw/brandstof**: NL €5,40, DE €4,96, FR €6,21, ES €5,73, IT €8,13, LU €4,94, AT €7,91, SE €7,91. BE binnenlandse retourprijs niet in deze cross-border tabel, dus niet gokken.
- Onderscheid **geplande klantretour** van **onbestelbaar/return-to-sender**, customs retour en omruiling. Historische onbestelbaar-toeslagen: €5,50 nationaal, €11 internationaal; contract verifiëren.

## 5. Technische checkoutregels (niet live zonder akkoord)
1. Eén gedeelde server-side allowed-country policy en gekoppelde Stripe landen; geen verschil tussen formulier en payment-provider.
2. Bereken op **daadwerkelijk afgerekend subtotaal na korting**, land, postcode, gekozen service (Home of Pickup), totaal gemeten volumetrisch/werkelijk gewicht, actuele bron-tarieven en toeslagen.
3. Server-side remote-area matching; als postcode onbekend of ambigu is, **blokkeer prijs en geef controleboodschap**.
4. Pas pas na match en servicebevestiging zone-tabel en gratisverzenddrempel toe.
5. Log kostenvergelijking per provider en marge na btw, inkoop, verpakking, betalingskosten en retourrisico; niet op gratis verzending bij een negatieve bijdrage.
6. Voeg productgewicht, land van oorsprong, per-SKU HS en verpakking toe aan product/backoffice. Geen generieke HS-code voor alle producten.
7. Houd MyParcel en DPD tarieven per account, datum, gewicht, zone en leveringstype gescheiden.

## 6. Beslispunten voordat dit live mag
- Bevestig of 30% inkoop op MRP **incl. of excl. btw** gebaseerd is, of MRP de effectieve consumentenprijs is, en typische marketingkortingen.
- Toegang tot actuele MyParcel-tariefstaffel/fuel/remote postcode data en DPD actuele accountstatus; eerste pilot-labels en succesvolle internationale test.
- Retourbeleid, reële retourpercentages en pakketgewichten per product vastleggen.
- **Geen aanpassing aan live website of checkout door dit document.**

Bijlagen in project: `MYPARCEL_DPD_2026_RATECARD_RETURNS.md`, `MYPARCEL_BELGIUM_PRICING_API_AUDIT.md`, `DPD_SHIPPING_RESEARCH_2026-10-30.md`, `DPD_X_INTERACTIVE_UNRESOLVED_TICKET_AUDIT.md`.
