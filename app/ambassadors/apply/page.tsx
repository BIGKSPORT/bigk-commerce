import AmbassadorApplicationForm from './application-form';

export const dynamic = 'force-dynamic';

export default function AmbassadorApplyPage() {
  if (process.env.PARTNER_APPLICATIONS_ENABLED !== 'true') {
    return (
      <main style={{minHeight:'70vh',display:'grid',placeItems:'center',padding:'48px 24px',background:'#f4f4f0',color:'#111',fontFamily:'Arial,Helvetica,sans-serif',textAlign:'center'}}>
        <section style={{maxWidth:620}}>
          <p style={{fontSize:12,fontWeight:800,letterSpacing:2,textTransform:'uppercase'}}>BIG K® PARTNERPROGRAMMA</p>
          <h1 style={{fontSize:'clamp(38px,6vw,64px)',lineHeight:1,letterSpacing:-2,margin:'18px 0'}}>Binnenkort beschikbaar</h1>
          <p style={{fontSize:17,lineHeight:1.6,color:'#555'}}>Partneraanvragen zijn momenteel nog niet geopend. Kom binnenkort terug voor meer informatie.</p>
          <a href="/" style={{display:'inline-block',marginTop:18,color:'#111',fontWeight:800}}>Terug naar BIG K®</a>
        </section>
      </main>
    );
  }

  return <AmbassadorApplicationForm />;
}
