# Zelf producten beheren

## Kleuren, maten en foto’s

1. Open **Backoffice → Products → Edit product**.
2. Upload nieuwe beelden bij **Product photos**, of kies **Choose existing photo**. Hier staat de algemene galerij.
3. Ga naar **Colours & sizes**. Vul bij **Add a colour with sizes** de kleur en de gewenste maten in, bijvoorbeeld `Blue` en `S, M, L, XL`. Kies **Add colour and sizes**.
4. Selecteer bij iedere variant de bijbehorende foto’s. Met **Apply these photos to all sizes in this colour** krijgt de hele kleurgroep dezelfde beelden.
5. Vul SKU, leveranciersartikel, EAN en voorraad per variant in. Nieuwe varianten beginnen met nul voorraad; onbekende EAN’s mogen leeg blijven in een concept.
6. Kies **Save Changes**, ververs en open **Preview saved product**. Op de productpagina wisselt de kleurkeuze zowel de maten als de bijbehorende galerij.

Bestaande Core 2-kleuren zijn opgeslagen als gekoppelde kleurartikelen. Bestaande artikelen, variant-ID’s en EAN’s blijven behouden. Voeg alleen ontbrekende kleur/maten toe; voer voor nieuwe varianten hun eigen leverancierscodes en EAN’s in.

## Technische pagina zoals ALPIN

1. Open **Technical product page** in dezelfde producteditor.
2. Kies **Start from current product page** om de huidige ALPIN/Nano-inhoud als bewerkbaar uitgangspunt te laden. Voor andere producten begint dit met de eigen opgeslagen gegevens.
3. Laat **Use my editable technical page** aangevinkt. Bewerk introductie, detailbijschrift en blokken. Elk blok heeft een label, kop, uitleg, foto, afbeeldingsbeschrijving en optioneel een logo of icoon. Voeg blokken toe, verplaats ze of verwijder ze.
4. Gebruik **Load photos from media library** om eerder geüploade detailbeelden te kiezen. Upload nieuwe beelden eerst bij Product photos of Media library.
5. Materiaal, pasvorm en onderhoud bewerk je bij **Specifications**.
6. Vul bij **Size guide explanation** de eenheden en meetmethode in: lichaamsmaten of kledingmaten. Kopieer voor een tabel de cellen uit Excel en plak ze bij **Size table**. Gebruik evenveel kolommen op iedere rij. Laat onbevestigde gegevens leeg.
7. Kies **Save Changes**, ververs en open de productpreview. De aangepaste pagina blijft opgeslagen in de database en staat in **Change history**.

Gebruik per product de eigen broninformatie. Controleer ook tekst ín afbeeldingen op Chinees; de editor verwijdert geen tekst uit foto’s. CHILL FLEX of THERMAL kies je alleen wanneer de productdocumentatie dat bevestigt.

## Ontbrekende afbeelding

Bestaande statische foto’s worden gecontroleerd tegen een bij de build gegenereerde lijst van werkelijk meegeleverde assets. Ze hoeven niet als bestand aanwezig te zijn in de serverless functie die een wijziging opslaat. Duurzame uploads worden apart in de mediastore gecontroleerd.

Als een werkelijk verdwenen upload wordt geselecteerd, toont de editor een specifieke melding. De onopgeslagen formuliergegevens blijven staan; verwijder die selectie of upload het beeld opnieuw. Een foto uit de galerij verwijderen verwijdert ook de variantkoppelingen naar die foto, terwijl het origineel in de bibliotheek behouden blijft.

Uitgevoerd op de ontwikkelbranch; publiceren naar productie blijft een afzonderlijke beslissing.
