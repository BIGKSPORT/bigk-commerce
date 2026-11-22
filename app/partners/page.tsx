'use client';

import Image from 'next/image';
import Link from 'next/link';

const partnerTypes = [
  ['01', 'Sportclubs & multisportverenigingen', 'Breng je club samen rond één herkenbaar sportmerk.'],
  ['02', 'Gyms & fitnesscentra', 'Activeer leden, trainers en je lokale sportcommunity.'],
  ['03', 'Running communities', 'Verbind lopers en groepen, van eerste kilometers tot race day.'],
  ['04', 'Fitness & OCR communities', 'Voor functional fitness, obstacle running en sportieve uitdagingen.'],
  ['05', 'Coaches & personal trainers', 'Deel je expertise en geef je klanten een eigen voordeel.'],
  ['06', 'Creators & ambassadors', 'Vertel jouw BIG K®-verhaal via je eigen kanalen.'],
  ['07', 'Sportevents & organisatoren', 'Maak van je event een startpunt voor een langdurige samenwerking.'],
];

const levels = [
  ['STARTER', '10%', 'Je start als BIG K® partner.'],
  ['ACTIVE', '15%', 'Je bouwt aan regelmatige verkoop.'],
  ['TOP', '20%', 'Je community groeit en activeert.'],
  ['ELITE', '25%', 'Je realiseert sterk en aantoonbaar volume.'],
  ['VIP / ELITE+', '30%', 'Voor strategische partners met uitzonderlijk bereik.'],
];

export default function PartnersPage() {
  return (
    <main className="partner-page">
      <header className="partner-header">
        <Link href="/" aria-label="BIG K® home"><Image src="/brand/bigk-wordmark-white.svg" alt="BIG K®" width={156} height={48} priority /></Link>
        <nav><a href="#programma">Het programma</a><a href="#niveaus">Partnerniveaus</a><a href="#hoe">Hoe werkt het?</a><Link className="header-cta" href="/ambassadors/apply">Word partner <span>↗</span></Link></nav>
      </header>

      <section className="partner-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> BIG K® PARTNERPROGRAMMA</p>
          <h1>ONE COMMUNITY.<br /><em>MANY SPORTS.</em></h1>
          <p className="hero-lead">Eén sterk netwerk voor iedereen die sport in beweging brengt.</p>
          <p className="hero-body">Van sportclubs en gyms tot coaches, creators en events. Samen bouwen we aan een actieve sportcommunity — met ruimte om te groeien.</p>
          <div className="hero-actions"><Link className="primary-cta" href="/ambassadors/apply">STEL JE KANDIDAAT <span>↗</span></Link><a className="text-cta" href="#programma">Ontdek het programma ↓</a></div>
        </div>
        <div className="hero-art" aria-label="BIG K partnerprogramma">
          <div className="art-ring ring-one" /><div className="art-ring ring-two" />
          <div className="art-panel"><span>BUILT FOR</span><strong>EVERY<br /><b>SPORT.</b></strong><small>LOOKING GOOD MOVING FAST.</small></div>
          <div className="art-stamp">BIG K®<br /><span>PARTNER<br />NETWORK</span></div>
          <div className="art-index">01 — 07<br />ONE NETWORK</div>
        </div>
      </section>

      <section className="partner-strip"><span>SPORTCLUBS</span><i /> <span>GYMS</span><i /> <span>COACHES</span><i /> <span>CREATORS</span><i /> <span>COMMUNITIES</span><i /> <span>EVENTS</span></section>

      <section className="partner-section intro" id="programma">
        <div><p className="eyebrow red">01 / ÉÉN PROGRAMMA</p><h2>Iedere sport.<br /><em>Dezelfde community.</em></h2></div>
        <div className="intro-copy"><p>BIG K® brengt verschillende sportwerelden samen in één partnernetwerk. Je krijgt een persoonlijke partnercode, ondersteuning en een samenwerking die kan meegroeien met jouw community.</p><p className="intro-bold">Geen versnipperde programma’s. Eén BIG K® community.</p></div>
      </section>

      <section className="partner-section types">
        <div className="section-heading"><div><p className="eyebrow red">02 / VOOR WIE?</p><h2>Wie kan partner worden?</h2></div><p>Elke community heeft zijn eigen kracht.<br />Iedereen kan mee bouwen.</p></div>
        <div className="type-grid">{partnerTypes.map(([n, title, desc]) => <article className="type-card" key={n}><span className="type-number">{n}</span><h3>{title}</h3><p>{desc}</p><span className="type-arrow">↗</span></article>)}</div>
      </section>

      <section className="levels-section" id="niveaus">
        <div className="levels-top"><div><p className="eyebrow">03 / GROEI SAMEN</p><h2>Jouw inzet.<br /><em>Jouw groeipad.</em></h2></div><p>Een groeimodel met vijf mogelijke niveaus. Je uiteindelijke commissieniveau wordt door BIGK BV bevestigd op basis van de partnerafspraken en gerealiseerde, geldige verkopen.</p></div>
        <div className="level-list">{levels.map(([name, rate, desc], i) => <div className="level-row" key={name}><span className="level-no">0{i + 1}</span><strong>{name}</strong><span className="level-desc">{desc}</span><b className={i === 4 ? 'level-rate max' : 'level-rate'}>{rate}</b></div>)}</div>
        <p className="level-note">Conceptuele groeiladder — percentages zijn voorstellen en worden pas actief na formele goedkeuring. Maximaal 30% directe commissie op eigen geldige verkopen; geen vergoeding voor het aanbrengen van andere partners.</p>
      </section>

      <section className="partner-section benefits">
        <div className="section-heading"><div><p className="eyebrow red">04 / SAMEN STERKER</p><h2>Meer dan een code.</h2></div><p>Een professionele samenwerking die jouw community en BIG K® vooruithelpt.</p></div>
        <div className="benefit-grid"><article><span>01</span><h3>Jouw eigen partnercode</h3><p>Een herkenbare code en persoonlijke tracking voor je community.</p></article><article><span>02</span><h3>Commerciële beloning</h3><p>Een transparante commissie op geldige verkopen die aan jou worden toegewezen.</p></article><article><span>03</span><h3>Campagnes & content</h3><p>Toegang tot geselecteerd promotiemateriaal en gezamenlijke acties.</p></article><article><span>04</span><h3>Persoonlijke opvolging</h3><p>Duidelijke afspraken, ondersteuning en inzicht in je resultaten.</p></article></div>
      </section>

      <section className="how-section" id="hoe"><div><p className="eyebrow">05 / DE VOLGENDE STAP</p><h2>Van kennismaking<br />tot <em>samen groeien.</em></h2></div><div className="steps"><article><b>01</b><div><h3>Aanmelden</h3><p>Vertel wie je bent en welke community je vertegenwoordigt.</p></div></article><article><b>02</b><div><h3>Beoordeling</h3><p>BIGK BV bekijkt je aanvraag en de mogelijke samenwerking.</p></div></article><article><b>03</b><div><h3>Goedkeuring</h3><p>Na akkoord ontvang je je partnerafspraken en persoonlijke code.</p></div></article><article><b>04</b><div><h3>Samen groeien</h3><p>Volg je resultaten en bouw aan je community.</p></div></article></div></section>

      <section className="partner-final"><Image src="/brand/bigk-wordmark-white.svg" alt="BIG K®" width={164} height={52} /><p>JOUW COMMUNITY.<br /><strong>ONZE BEWEGING.</strong></p><Link href="/ambassadors/apply">WORD BIG K® PARTNER <span>↗</span></Link><small>LOOKING GOOD MOVING FAST.</small></section>
      <footer className="partner-footer"><span>© {new Date().getFullYear()} BIGK BV · BIG K®</span><span>ONE COMMUNITY. MANY SPORTS.</span><Link href="/info/contact">Contact</Link></footer>

      <style jsx>{`
        .partner-page{--red:#E4002B;--ink:#2D2926;background:#fff;color:var(--ink);font-family:Arial,Helvetica,sans-serif}
        .partner-header{height:82px;background:var(--ink);display:flex;align-items:center;justify-content:space-between;padding:0 5.5%;gap:25px}
        .partner-header nav{display:flex;align-items:center;gap:30px;color:#fff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .partner-header nav a:hover{color:#ff526d}.partner-header .header-cta{background:var(--red);padding:13px 17px;color:#fff}
        .partner-hero{background:var(--ink);color:#fff;min-height:590px;padding:72px 7% 80px;display:grid;grid-template-columns:1fr .9fr;gap:30px;overflow:hidden}
        .eyebrow{font-size:10px;letter-spacing:.2em;font-weight:900}.eyebrow span{display:inline-block;width:7px;height:7px;background:var(--red);border-radius:50%;margin-right:9px}
        h1,h2,p{margin-top:0}.partner-hero h1{font-size:clamp(48px,7vw,94px);line-height:.91;letter-spacing:-.075em;margin:36px 0 25px;font-weight:950}.partner-hero em,.partner-section h2 em,.levels-top h2 em,.how-section h2 em{font-style:normal;color:var(--red)}
        .hero-lead{font-size:20px;font-weight:800;max-width:530px}.hero-body{color:#c7c3c0;max-width:520px;line-height:1.8;font-size:14px}
        .hero-actions{display:flex;align-items:center;gap:24px;margin-top:34px;flex-wrap:wrap}.primary-cta{background:var(--red);padding:17px 22px;color:#fff;font-size:11px;font-weight:900;letter-spacing:.08em}.text-cta{font-size:12px;font-weight:800}
        .hero-art{min-height:390px;position:relative;display:flex;align-items:center;justify-content:center}.art-ring{position:absolute;border:1px solid #68625e;border-radius:50%;width:430px;height:430px}.ring-two{width:330px;height:330px;border-color:#E4002B;transform:rotate(25deg);border-radius:42%}.art-panel{position:relative;z-index:1;background:var(--red);width:300px;height:320px;padding:32px;display:flex;flex-direction:column;justify-content:space-between;transform:rotate(-7deg);box-shadow:22px 22px 0 rgba(255,255,255,.08)}.art-panel>span{font-size:11px;letter-spacing:.2em;font-weight:900}.art-panel strong{font-size:65px;line-height:.8;letter-spacing:-.08em}.art-panel strong b{color:var(--ink)}.art-panel small{font-size:9px;font-weight:900;letter-spacing:.13em}.art-stamp{position:absolute;z-index:2;right:1%;top:10%;background:#fff;color:var(--ink);padding:13px 18px;font-weight:950;font-size:20px;transform:rotate(7deg)}.art-stamp span{font-size:9px;letter-spacing:.1em;color:var(--red)}.art-index{position:absolute;bottom:0;right:4%;font-size:10px;line-height:1.8;letter-spacing:.15em;color:#c7c3c0;text-align:right}
        .partner-strip{display:flex;align-items:center;justify-content:space-evenly;gap:12px;flex-wrap:wrap;padding:20px 4%;background:#f1efed;font-size:10px;font-weight:900;letter-spacing:.16em}.partner-strip i{width:5px;height:5px;background:var(--red);border-radius:50%}
        .partner-section{padding:100px 8%}.intro{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.red{color:var(--red)}.partner-section h2,.levels-top h2,.how-section h2{font-size:clamp(38px,5vw,64px);letter-spacing:-.065em;line-height:.98;font-weight:950;margin:18px 0 0}.intro-copy{font-size:17px;line-height:1.8;color:#615b57}.intro-bold{font-weight:900;color:var(--ink)}
        .types{background:#f5f3f1}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:38px}.section-heading>p{font-size:13px;color:#746d68;line-height:1.7}.type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.type-card{position:relative;background:#fff;min-height:190px;padding:25px;border-bottom:3px solid transparent;transition:border-color .2s,transform .2s}.type-card:hover{border-color:var(--red);transform:translateY(-3px)}.type-number{font-size:10px;color:var(--red);font-weight:900;letter-spacing:.1em}.type-card h3{font-size:19px;letter-spacing:-.04em;margin:28px 0 8px}.type-card p{font-size:12px;line-height:1.65;color:#756e69;max-width:280px}.type-arrow{position:absolute;right:22px;top:20px;font-size:18px;color:var(--red)}
        .levels-section{background:var(--ink);color:#fff;padding:100px 8%}.levels-top{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:end;margin-bottom:48px}.levels-top>p{color:#c7c3c0;line-height:1.8;font-size:14px;max-width:480px}.level-list{border-top:1px solid #625d59}.level-row{display:grid;grid-template-columns:50px 1fr 1.4fr 100px;gap:18px;align-items:center;padding:21px 8px;border-bottom:1px solid #625d59}.level-no{font-size:10px;color:#a9a29d}.level-row strong{font-size:17px;letter-spacing:.03em}.level-desc{font-size:12px;color:#bcb5b0}.level-rate{font-size:32px;font-weight:950;text-align:right;letter-spacing:-.06em}.level-rate.max{color:var(--red)}.level-note{font-size:10px;line-height:1.7;color:#bcb5b0;margin:20px 0 0;max-width:850px}
        .benefits{background:#fff}.benefit-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:50px}.benefit-grid article{border-top:2px solid var(--red);padding-top:18px}.benefit-grid article>span{font-size:10px;color:var(--red);font-weight:900}.benefit-grid h3{font-size:18px;letter-spacing:-.04em;margin:24px 0 10px}.benefit-grid p{font-size:12px;color:#756e69;line-height:1.7}
        .how-section{background:#f5f3f1;padding:90px 8%;display:grid;grid-template-columns:1fr 1fr;gap:60px}.steps{border-top:1px solid #d6d1cd}.steps article{display:flex;gap:22px;padding:20px 0;border-bottom:1px solid #d6d1cd}.steps article>b{font-size:12px;color:var(--red)}.steps h3{font-size:17px;margin:0 0 5px}.steps p{font-size:12px;color:#756e69;margin:0;line-height:1.6}
        .partner-final{background:var(--red);color:#fff;padding:70px 8%;display:flex;align-items:center;justify-content:space-between;gap:25px;flex-wrap:wrap}.partner-final>p{font-size:clamp(24px,3vw,42px);font-weight:900;line-height:1.05;letter-spacing:-.05em;margin:0}.partner-final>p strong{color:var(--ink)}.partner-final>a{background:var(--ink);padding:17px 20px;font-size:11px;font-weight:900;letter-spacing:.08em}.partner-final small{width:100%;font-size:10px;letter-spacing:.2em;font-weight:900}.partner-footer{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;padding:22px 6%;font-size:10px;letter-spacing:.08em;color:#756e69}
        @media(max-width:800px){.partner-header{height:auto;min-height:72px;padding:15px 5%;flex-wrap:wrap}.partner-header nav{gap:14px;flex-wrap:wrap}.partner-header nav>a:not(.header-cta){display:none}.partner-hero{grid-template-columns:1fr;padding:58px 7%}.hero-art{min-height:340px}.intro,.levels-top,.how-section{grid-template-columns:1fr;gap:25px}.partner-section,.levels-section{padding:70px 7%}.type-grid{grid-template-columns:repeat(2,1fr)}.benefit-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.partner-header nav{width:100%;justify-content:space-between}.partner-header .header-cta{padding:10px 12px}.partner-hero h1{font-size:52px}.hero-art{min-height:300px}.art-panel{width:245px;height:270px}.art-panel strong{font-size:54px}.art-ring{width:300px;height:300px}.ring-two{width:245px;height:245px}.type-grid,.benefit-grid{grid-template-columns:1fr}.section-heading{display:block}.level-row{grid-template-columns:28px 1fr 70px;gap:10px}.level-desc{grid-column:2;grid-row:2}.level-rate{grid-column:3;grid-row:1/3;font-size:28px}.partner-final{display:block}.partner-final>p{margin:28px 0}.partner-final>a{display:inline-block}.partner-footer{display:block;line-height:2.2}}
      `}</style>
    </main>
  );
}
