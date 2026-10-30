# BIG K ® — Retourbeleid en retourkostmodel (voorstel)

**Datum:** 30 oktober 2026  
**Status:** CONCEPT, interne werkbasis; niet gepubliceerd of geactiveerd in checkout/backoffice.

## Verplicht wettelijk minimum
- EU online particuliere aankopen hebben doorgaans een herroepingstermijn van **14 dagen na ontvangst** om herroeping te melden, zonder reden. Daarna heeft de consument doorgaans nog **14 dagen om de goederen terug te sturen**. Controleer bijzondere termijnen en uitzonderingen indien relevant.
- Bij volledige herroeping wordt het betaalde aankoopbedrag inclusief de goedkoopste aangeboden standaardlevering terugbetaald (niet noodzakelijk toeslagen voor expresskeuze). De verkoper mag terugbetaling in beginsel opschorten totdat producten ontvangen zijn of bewijs van retourzending is verstrekt. Wettelijke termijnen en betalingswijze respecteren.
- Directe kosten van een gewone herroepingsretour mogen aan de consument worden doorgerekend **als vooraf duidelijk vermeld**. Bied een eigen verzendmethode of expliciet optioneel door BIG K ® aangeboden retourlabel aan, zonder misleidende kosten.
- Gewoon passen zoals in een winkel kan; niet systematisch weigeren omdat de verpakking open is. Werkelijke waardevermindering bij verdergaand gebruik afzonderlijk en volgens de regels beoordelen.
- Bij non-conformiteit (fout artikel, defect, beschadigd bij ontvangst) de verplichtingen rond wettelijke garantie/aflevering respecteren, waaronder kosteloze passende oplossing en noodzakelijke transportkosten.
- Bepaal beleid voor gedeeltelijke retourneringen, kortingsbundels en gratis-verzenddrempel: geen retroactieve onduidelijke verzendboete; voorwaarden vooraf communiceren en juridisch controleren.

Bronnen: https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_nl.htm ; https://consumerconnect.be/en/themes/purchases/regret/outside-sales/charging-returns ; https://economie.fgov.be/nl/themas/verkoop/vormen-van-verkoop/verkoop-op-afstand/verkoop-op-afstand ; https://economie.fgov.be/nl/themas/consumentenbescherming/garantie-uw-rechten-als

## Commercieel voorstel
| Scenario | Beleid | Betaler |
|---|---|---|
| Gewone herroeping | 14 dagen wettelijk, klant kan zelf aantoonbaar terugzenden of optioneel MyParcel-label aanvragen | Klant rechtstreekse retourskost |
| Verkeerde maat / gewenste kleurwisseling | Eén gecontroleerde omruiling, na inspectie en beschikbaarheid; BIG K ® betaalt één standaard nieuwe verzending voor BE/NL/LU/DE/FR (normale postcode) | Klant terugzending; BIG K ® vervangend standaardtransport |
| Verkeerd artikel verzonden | Kosteloos retour en correcte vervanging | BIG K ® |
| Defect/garantiegeval | Wettelijke garantieprocedure; noodzakelijke retour- en vervangingskosten voor BIG K ® wanneer toepasselijk | BIG K ® |
| Eilanden en afgelegen postcodes | Handmatige carrier/retourtariefvalidatie; geen automatische gratis omruilverzending | Afhankelijk van reden en wettelijke verplichting |
| Buiten EU | Nog geen automatische retourlabels/omruilservices zonder douane- en carrier-validatie | Per toepasselijke rechten, situatie en vooraf gepubliceerd beleid |

**Klantgericht:** gratis nieuwe verzending voor maximaal één gecontroleerde omruiling in beperkte kernmarkten is een vrijwillig extra voordeel, geen beperking van het wettelijke herroepingsrecht. Klant kan steeds normale herroeping kiezen.

## MyParcel 2026 Shop Return bron: offerte/pdf p.17
Basis retourprijzen, 0–20kg, EX btw en variabele brandstof:
| Land | Basis MyParcel € | Voorgestelde optionele klantlabelvergoeding (indicatief, incl. btw) € |
|---|---:|---:|
| NL | 5,40 | 7,95 |
| DE | 4,96 | 7,95 |
| LU | 4,94 | 7,95 |
| FR | 6,21 | 9,95 |
| ES | 5,73 | 9,95 |
| IT | 8,13 | 12,95 |
| AT | 7,91 | 11,95 |
| SE | 7,91 | 11,95 |

Bron: Gmail 11 maart 2026 naar Maxim, PDF `DPD_Tarieven_2026_NL.pdf`, p.17. Dit zijn historische referenties. Actualiseer brandstof, actuele staffel, btw, toelaatbaarheid en land. **Geen BE-binnenlandse retourprijs in die tabel; niet schatten.** Andere landen nog geen vast klantbedrag.

Let op: zelfs deze indicatieve tarieven kunnen onrendabel zijn als brandstof/toeslag stijgt. Eilanden, afgelegen bestemmingen, express, te zware en grote zendingen altijd aparte prijs of toegestane eigen retourmethode. Geen label aanmaken of kosten innen zonder expliciete klantkeuze.

## Retourkosten en marge
Gegeven: inkoop = 30% van MRP. Voorbeeld MRP €100 incl. 21% btw en inkoop €30 geeft bijdrage vóór logistiek/overhead €52,64; bij volledige retour vervalt omzet en komen verzend- en behandelkosten daar nog bij. Daarom gratis standaardretours niet universeel aanbieden. Bij omruiling blijft de verkoop doorgaans behouden; gratis één nieuwe levering kan commercieel zinvol zijn bij gemiddelde orderwaardes en normale bestemmingen, maar alsnog per geval loggen.

## Backoffice en klantenervaring
1. Retourportaal: bestelnummer en geverifieerde bestelmail; item/hoeveelheid; reden; binnen termijn; keuze refund of omruiling; ontvangstdatum (wettelijk).
2. Retourtype: `withdrawal`, `exchange`, `merchant_error`, `warranty`, `undeliverable`, `customs_return` — elk met eigen betaler/status, niet allemaal op één tarief.
3. Duidelijk tonen vóór koop: herroepingsrecht en wie normale retour betaalt, commerciële omruilvoordeel, leverings- en toeslagregels; na verzoek labelprijs vóór akkoord.
4. Eiland/remote postcode controleren aan hand van actuele land/postcode zones in verzendrichting; **retourtraject hoeft niet dezelfde toeslag als uitgaand traject te hebben**.
5. Label uitsluitend na akkoord en succesvolle carrier/contract-validatie; factuur controle, incident-/scan-overzicht, voorkomen dat ongebruikte labels ten onrechte gefactureerd worden.
6. Warehouse inspectie: ontvangen datum, conditie, aantallen, eventuele waardevermindering en correcte restocking zonder dubbel tellen.
7. Refundregels, betaling en e-mail notificaties vóór productie testen; voorwaarden juridisch beoordelen.

**Niet live zetten voordat eigenaar inhoud, klantretourbedragen, omruilvoordeel en retouradres bevestigt.**

## Aanvulling 30 oktober 2026 — maat te klein / maatruil
- Voorbeeld: maat M te klein, klant kiest maat L van hetzelfde artikel/dezelfde kleur.
- Retourportaal biedt naast **Herroepen en terugbetaling** de vrijwillige keuze **Maat omruilen**. De wettelijke herroepingsmogelijkheid mag hierdoor niet worden beperkt.
- Controleer variant (maat L) en actuele voorraad; reserveer uitsluitend met vervaldatum en voorraadtransactie. Geen onbeperkte voorraadreservering.
- Klant betaalt bij een gewone pasvormwissel de retourverzending; BIG K ® betaalt **één keer** de nieuwe standaardlevering voor BE/NL/LU/DE/FR (voorstel, niet live), nadat maat M is ontvangen en op toestand gecontroleerd. Andere/buitenlandse/remote postcodes: kosten vóór bevestiging afzonderlijk valideren.
- Bij gebrek/verkeerd geleverd product gelden wettelijke kosteloze-remedieverplichtingen, niet deze vrijwillige regeling.
- BE retourbudget **voorlopig vergelijkbaar met NL** volgens eigenaar, maar **geen fictief BE-labeltarief vastleggen**: actuele MyParcel BE retourkost laten bevestigen vóór klantprijslijst.
- Bij L niet voorradig: biedt een alternatieve variant aan of behandel herroeping/refund volgens de wet. Geen automatisch gedwongen tegoedbon.
- Bij een volledige wettelijke herroeping is de goedkoopste standaard oorspronkelijke levering terugbetaalbaar; herroeping kan in beginsel worden gemeld binnen 14 dagen na ontvangst en er zijn daarna doorgaans 14 dagen voor de terugzending. Bij omruiling moet een eventuele aparte verkoop/orderbalans en status traceerbaar blijven.
- Onderzoek als alternatief 'eerst nieuwe maat versturen' uitsluitend na risicobeheer; standaard is eerst retour ontvangen.
