import Link from 'next/link';

const sections = [
  {title:'1. Welke gegevens verwerken we?',body:'Voor een aanvraag verwerken we naam, e-mailadres, publiek profiel-URL, informatie over je community, motivatie, aanvraagstatus en het tijdstip en de versie van de getoonde privacy-informatie en programmavoorwaarden. Na goedkeuring kunnen bijkomende gegevens nodig zijn voor contractbeheer, commissieafrekening, facturatie en betaling.'},
  {title:'2. Waarom en op welke rechtsgrond?',body:'BIGK BV gebruikt deze gegevens om je aanvraag te beoordelen en precontractuele stappen te zetten, een goedgekeurde samenwerking te beheren, een persoonlijke code toe te kennen, commissies en bestellingen correct toe te rekenen, fraude te voorkomen en wettelijke boekhoudkundige en fiscale verplichtingen na te komen. De rechtsgrond hangt af van het doel: precontractuele maatregelen of uitvoering van de overeenkomst, wettelijke verplichtingen en waar passend gerechtvaardigde belangen zoals beveiliging en fraudepreventie. Het aanvinken van “gelezen” bevestigt kennisname en is geen algemene of onbeperkte AVG-toestemming.'},
  {title:'3. Met wie delen we gegevens?',body:'Gegevens zijn alleen toegankelijk voor bevoegde medewerkers van BIGK BV en dienstverleners die noodzakelijk zijn voor hosting, database, e-mail, beveiliging, boekhouding en betalingsadministratie. Zij mogen gegevens alleen verwerken voor de overeengekomen dienstverlening en met passende contractuele waarborgen. BIGK BV verkoopt geen persoonsgegevens. Partners krijgen geen toegang tot persoonsgegevens van klanten; hun dashboard toont alleen de noodzakelijke commissie- en bestelgegevens.'},
  {title:'4. Doorgiften buiten de EER',body:'Wanneer een dienstverlener persoonsgegevens buiten de Europese Economische Ruimte verwerkt of daar toegang toe heeft, gebruikt BIGK BV een toepasselijke doorgiftegrondslag, zoals een adequaatheidsbesluit of standaardcontractbepalingen, en waar nodig aanvullende waarborgen. De concrete leveranciers, locaties en doorgiften worden in de leveranciersdocumentatie en het verwerkingsregister bijgehouden.'},
  {title:'5. Hoe lang bewaren we gegevens?',body:'Aanvraaggegevens worden niet langer bewaard dan noodzakelijk voor de beoordeling, het beheer van de samenwerking, de behandeling van mogelijke claims en wettelijke verplichtingen. Financiële en fiscale bewijsstukken kunnen gedurende de toepasselijke wettelijke bewaartermijn worden bewaard. Beveiligings- en toegangslogs worden periodiek verwijderd volgens het interne bewaarschema. De precieze bewaartermijnen per categorie moeten vóór definitieve ingebruikname worden bevestigd en in het bewaarschema worden vastgelegd.'},
  {title:'6. Je rechten en contact',body:'Je kan, binnen de voorwaarden van de AVG, verzoeken om inzage, verbetering, wissing, beperking, bezwaar of overdraagbaarheid. Dien je verzoek in via de contactpagina van BIG K®. Je hebt ook het recht een klacht in te dienen bij de Belgische Gegevensbeschermingsautoriteit.'},
  {title:'7. Beveiliging',body:'BIGK BV beperkt toegang tot bevoegde medewerkers en gebruikt technische en organisatorische beveiligingsmaatregelen. Deel bank- of identiteitsdocumenten alleen via een door BIGK BV uitdrukkelijk aangewezen beveiligd kanaal; stuur ze niet mee met de openbare aanvraag.'},
];

export default function AmbassadorPrivacyPage() {
  return <main style={{maxWidth:820,margin:'48px auto',padding:'0 20px',fontFamily:'Arial,sans-serif',lineHeight:1.7,color:'#252525'}}>
    <p><strong>BIG K®</strong></p>
    <p style={{display:'inline-block',background:'#fff1f1',color:'#b00020',padding:'5px 10px',fontSize:12,fontWeight:700}}>ONTWERP — CONTROLE VAN LEVERANCIERS EN BEWAARTERMIJNEN VEREIST</p>
    <h1>Privacy-informatie — BIG K® partneraanvraag</h1>
    <p><strong>Verwerkingsverantwoordelijke:</strong> BIGK BV, Theo Verellenlaan 27, 2990 Wuustwezel, België. Ondernemings- en btw-nummer: BE 1034.189.749.</p>
    <p><strong>Versie 0.3 — 22 november 2026.</strong> Deze informatie is specifiek voor partneraanvragen. De algemene privacyverklaring van BIG K® blijft aanvullend van toepassing.</p>
    {sections.map(section=><section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
    <p>Contact: <Link href="/info/contact">BIG K® contactpagina</Link>. Belgische Gegevensbeschermingsautoriteit: <a href="https://www.gegevensbeschermingsautoriteit.be/" rel="noreferrer">gegevensbeschermingsautoriteit.be</a>.</p>
    <p><strong>Controle vóór definitieve publicatie:</strong> bevestig de actuele leveranciers en doorgiftelocaties, bewaartermijnen per gegevenscategorie, contactkanaal voor privacyverzoeken en eventuele functionaris voor gegevensbescherming.</p>
  </main>;
}
