import type {Product, ProductTranslation} from './types';
import type {SiteLocale} from './i18n/site-routing';
import {applyProductCopy} from './i18n/apply-product-copy';

const whitePhotos = [
  '832b1b734ce29ac4d324c7c1e8c00771d53f47fc4be7676f57971e049b43c673',
  '0fb4c020408442f4022b6e839fcd0b99aa60c33d6e5188a2507c62f4a19e0dac',
  '7b24811c1b3bd4fe31c1f943bf4b72023eef0fff724ea055e7db6ed6ff50689f',
  '2ab7210ea2f88bf0319668265ca5e9b9043a9bb4e6780708ea74e8627519dc08',
].map(id => '/api/media/'+id+'.webp');

type FeatureCopy = [name: string, heading: string, description: string, alt: string];
type WhiteCopy = Required<Pick<ProductTranslation,'description'|'details'|'composition'|'fit'|'care'|'seoTitle'>> & {
  caption: string;
  sizeGuide: string;
  sizeLabel: string;
  features: [FeatureCopy,FeatureCopy,FeatureCopy,FeatureCopy];
};

const whiteCopy: Record<SiteLocale,WhiteCopy> = {
  en: {
    seoTitle: 'B10 White Sneakers | Memory Foam & Puffsole | BIG K',
    description: 'Cream panels, textured white fabric and a bright red heel give the B10 White its retro running look. A soft Memory Foam insole and lightweight sole make it a comfortable everyday sneaker.',
    details: 'Low-top lace-up sneaker with layered panels, a red heel band and a black tread. The red accent continues along the white midsole.',
    composition: 'Upper: 60% leather, 25% textile, 15% polyurethane (PU)\nLining: 100% textile\nOutsole: 80% EVA, 20% rubber',
    fit: 'Unisex EU sizes 36–46. If you’re between sizes or unsure what to choose, contact BIG K before ordering.',
    care: 'Follow the care instructions supplied with your sneakers.',
    caption: 'From the Memory Foam insole to the textured upper and signature red heel, take a closer look at the B10 White.',
    sizeGuide: 'The centimetre values come from the manufacturer’s size labels. They are sizing references, not measurements of the inside of the shoe.',
    sizeLabel: 'Label reference (cm)',
    features: [
      ['Memory Foam','Soft cushioning underfoot','The Memory Foam insole adds a soft layer of cushioning for everyday wear.','Red B10 White insole with the Memory Foam marking'],
      ['Layered upper','Texture in the details','Cream overlays frame the textured white textile. The close-up shows the stitching and the red BIG K lace tip.','Close-up of the cream panels, white textile and red lace tip'],
      ['BIG K signature','A flash of red at the heel','The red heel band wraps around the back of the shoe. The B10 mark and the red accent on the white midsole stand out in profile.','Red heel band with the B10 mark and matching midsole accent'],
      ['Puffsole','A closer look at the tread','The black outsole has a raised block pattern with fine ridges and the BIG K emblem worked into the tread.','Black B10 White outsole with ridged blocks and BIG K emblems'],
    ],
  },
  nl: {
    seoTitle: 'B10 White sneakers | Memory Foam & Puffsole | BIG K',
    description: 'Crèmekleurige panelen, wit textiel met structuur en een felrood hielaccent geven de B10 White de uitstraling van een retro hardloopschoen. De zachte Memory Foam-binnenzool en lichte zool maken hem comfortabel voor elke dag.',
    details: 'Lage vetersneaker met overlappende panelen, een rode hielband en een zwart zoolprofiel. Het rode accent loopt door op de witte tussenzool.',
    composition: 'Bovenwerk: 60% leer, 25% textiel, 15% polyurethaan (PU)\nVoering: 100% textiel\nBuitenzool: 80% EVA, 20% rubber',
    fit: 'Unisex EU-maten 36–46. Twijfel je tussen twee maten? Neem vóór je bestelt contact op met BIG K.',
    care: 'Volg de onderhoudsinstructies die bij je sneakers zitten.',
    caption: 'Bekijk de B10 White van dichtbij, van de Memory Foam-binnenzool en het textiel met structuur tot de kenmerkende rode hiel.',
    sizeGuide: 'De waarden in centimeters komen van de maatlabels van de fabrikant. Ze dienen als maatreferentie en geven de binnenlengte van de schoen niet aan.',
    sizeLabel: 'Maatreferentie op het label (cm)',
    features: [
      ['Memory Foam','Zachte demping onder je voet','De Memory Foam-binnenzool geeft je voet een zachte laag demping bij dagelijks gebruik.','Rode binnenzool van de B10 White met het opschrift Memory Foam'],
      ['Gelaagd bovenwerk','Structuur tot in de details','Crèmekleurige panelen omlijsten het witte textiel met structuur. Van dichtbij zie je het stikwerk en de rode BIG K-veterpunt.','Detail van de crèmekleurige panelen, het witte textiel en de rode veterpunt'],
      ['BIG K-signatuur','Een rood accent rond de hiel','De rode band loopt rond de hiel. In zijaanzicht vallen het B10-logo en het rode accent op de witte tussenzool op.','Rode hielband met B10-logo en rood accent op de tussenzool'],
      ['Puffsole','Het zoolprofiel van dichtbij','De zwarte buitenzool heeft verhoogde profielblokken met fijne ribbels en het BIG K-embleem in het profiel.','Zwarte buitenzool met geribbelde profielblokken en BIG K-emblemen'],
    ],
  },
  fr: {
    seoTitle: 'Baskets B10 White | Memory Foam et Puffsole | BIG K',
    description: 'Des empiècements crème, un textile blanc texturé et un talon rouge vif donnent à la B10 White une allure de running rétro. Sa semelle intérieure souple en mousse à mémoire de forme et sa semelle légère offrent un chaussant confortable au quotidien.',
    details: 'Basket basse à lacets, avec des empiècements superposés, une bande rouge au talon et une semelle d’usure noire à relief. Une touche de rouge se prolonge sur la semelle intermédiaire blanche.',
    composition: 'Tige : 60 % cuir, 25 % textile, 15 % polyuréthane (PU)\nDoublure : 100 % textile\nSemelle d’usure : 80 % EVA, 20 % caoutchouc',
    fit: 'Pointures EU unisexes du 36 au 46. Si vous hésitez entre deux pointures, contactez BIG K avant de commander.',
    care: 'Suivez les conseils d’entretien fournis avec vos baskets.',
    caption: 'De la semelle intérieure Memory Foam au talon rouge emblématique, découvrez les matières et les finitions de la B10 White en gros plan.',
    sizeGuide: 'Les valeurs en centimètres proviennent des étiquettes du fabricant. Elles servent de repère pour le choix de la pointure et ne correspondent pas à la longueur intérieure de la chaussure.',
    sizeLabel: 'Repère sur l’étiquette (cm)',
    features: [
      ['Memory Foam','Un amorti souple sous le pied','La semelle intérieure en mousse à mémoire de forme apporte un amorti souple au quotidien.','Semelle intérieure rouge de la B10 White, marquée Memory Foam'],
      ['Tige à empiècements','Des matières qui se répondent','Les empiècements crème encadrent le textile blanc texturé. Le gros plan révèle les surpiqûres et l’embout de lacet rouge signé BIG K.','Gros plan sur les empiècements crème, le textile blanc et l’embout de lacet rouge'],
      ['Signature BIG K','Une touche de rouge au talon','La bande rouge enveloppe le talon. De profil, le marquage B10 et le rappel rouge sur la semelle intermédiaire blanche ressortent.','Bande rouge du talon avec le marquage B10 et rappel rouge sur la semelle'],
      ['Puffsole','Le relief de la semelle en détail','La semelle d’usure noire présente des blocs en relief finement striés, ponctués de l’emblème BIG K.','Semelle d’usure noire avec blocs striés et emblèmes BIG K'],
    ],
  },
  es: {
    seoTitle: 'Zapatillas B10 White | Memory Foam y Puffsole | BIG K',
    description: 'Las piezas en tono crema, el tejido blanco con relieve y el talón rojo intenso dan a las B10 White un aire de zapatilla de running retro. La plantilla suave de espuma viscoelástica y la suela ligera aportan comodidad en el día a día.',
    details: 'Zapatilla baja de cordones con piezas superpuestas, una banda roja en el talón y una suela negra con relieve. El detalle rojo continúa en la entresuela blanca.',
    composition: 'Exterior: 60 % cuero, 25 % textil, 15 % poliuretano (PU)\nForro: 100 % textil\nSuela exterior: 80 % EVA, 20 % caucho',
    fit: 'Tallas unisex EU 36–46. Si dudas entre dos tallas, consulta con BIG K antes de hacer tu pedido.',
    care: 'Sigue las instrucciones de cuidado que se incluyen con tus zapatillas.',
    caption: 'Descubre de cerca los detalles de las B10 White, desde la plantilla Memory Foam y el tejido con relieve hasta el característico talón rojo.',
    sizeGuide: 'Los valores en centímetros proceden de las etiquetas del fabricante. Sirven como referencia de talla y no indican la longitud interior de la zapatilla.',
    sizeLabel: 'Referencia de la etiqueta (cm)',
    features: [
      ['Memory Foam','Amortiguación suave bajo el pie','La plantilla de espuma viscoelástica añade una capa de amortiguación suave para el uso diario.','Plantilla roja de las B10 White con la inscripción Memory Foam'],
      ['Exterior por capas','Textura en cada detalle','Las piezas de color crema enmarcan el tejido blanco con relieve. El primer plano muestra las costuras y el terminal rojo del cordón con la firma BIG K.','Detalle de las piezas en crema, el tejido blanco y el terminal rojo del cordón'],
      ['Firma BIG K','Un toque de rojo en el talón','La banda roja rodea el talón. De perfil destacan el distintivo B10 y el detalle rojo sobre la entresuela blanca.','Banda roja del talón con el distintivo B10 y detalle a juego en la entresuela'],
      ['Puffsole','El dibujo de la suela de cerca','La suela exterior negra tiene bloques en relieve con estrías finas y el emblema BIG K integrado en el dibujo.','Suela negra con bloques estriados y emblemas BIG K'],
    ],
  },
  it: {
    seoTitle: 'Sneakers B10 White | Memory Foam e Puffsole | BIG K',
    description: 'Inserti color crema, tessuto bianco strutturato e un tallone rosso acceso danno alle B10 White il look di una scarpa da running rétro. Il morbido sottopiede in Memory Foam e la suola leggera le rendono comode tutti i giorni.',
    details: 'Sneaker bassa con lacci, pannelli sovrapposti, fascia rossa al tallone e battistrada nero. Il dettaglio rosso prosegue sull’intersuola bianca.',
    composition: 'Tomaia: 60% pelle, 25% tessuto, 15% poliuretano (PU)\nFodera: 100% tessuto\nBattistrada: 80% EVA, 20% gomma',
    fit: 'Taglie unisex EU 36–46. Se sei indeciso tra due taglie, contatta BIG K prima di ordinare.',
    care: 'Segui le istruzioni per la cura fornite con le sneakers.',
    caption: 'Scopri da vicino la B10 White, dal sottopiede in Memory Foam alla tomaia strutturata e all’inconfondibile tallone rosso.',
    sizeGuide: 'I valori in centimetri provengono dalle etichette del produttore. Sono riferimenti per la scelta della taglia e non misure della lunghezza interna della scarpa.',
    sizeLabel: 'Riferimento in etichetta (cm)',
    features: [
      ['Memory Foam','Una morbida ammortizzazione','Il sottopiede in Memory Foam aggiunge uno strato di morbida ammortizzazione per tutti i giorni.','Sottopiede rosso della B10 White con la scritta Memory Foam'],
      ['Tomaia a strati','Texture in primo piano','Gli inserti color crema incorniciano il tessuto bianco strutturato. Da vicino si notano le impunture e il puntale rosso del laccio firmato BIG K.','Dettaglio degli inserti crema, del tessuto bianco e del puntale rosso del laccio'],
      ['Firma BIG K','Un tocco di rosso al tallone','La fascia rossa avvolge il tallone. Di profilo spiccano il marchio B10 e il richiamo rosso sull’intersuola bianca.','Fascia rossa al tallone con marchio B10 e dettaglio rosso sull’intersuola'],
      ['Puffsole','Il battistrada da vicino','Il battistrada nero presenta tasselli in rilievo con sottili scanalature e lo stemma BIG K integrato nel disegno.','Battistrada nero con tasselli scanalati e stemmi BIG K'],
    ],
  },
};


const greenPhotos = [
  'dad584ba2702d99b5d35ae5314024b51e9d7b006efc03e2f666b3b40c249a428',
  '396c996f61865663204c09ec5721abc884ac0633be22f4241de743d26389054c',
  '44c30af38b814349d448f8182b94b53611f493839ccdfaa956dbb0e491e6aecf',
  '2ab7210ea2f88bf0319668265ca5e9b9043a9bb4e6780708ea74e8627519dc08',
].map(id => '/api/media/'+id+'.webp');

const greenCopy: Record<SiteLocale,Pick<WhiteCopy,'description'|'details'|'caption'|'features'>> = {
  en: {
    description: 'Teal-green overlays, beige textile and a bright red heel give the B10 Green its retro running look. A soft Memory Foam insole and lightweight sole make it a comfortable everyday sneaker.',
    details: 'Low-top lace-up sneaker with green overlays, layered beige panels, a red heel band and a black patterned outsole. The red accent continues along the white midsole.',
    caption: 'A closer look at the B10 Green, from the Memory Foam insole to the layered upper and signature red heel.',
    features: [
      ['Memory Foam','Soft cushioning underfoot','The Memory Foam insole adds a soft layer of cushioning for everyday wear.','Beige B10 Green insole with the Memory Foam marking'],
      ['Layered upper','Green frames the beige textile','Teal-green overlays trace the toe, eyelets and heel, framing the beige textured textile.','Side profile of the B10 Green with teal-green overlays and beige textile'],
      ['BIG K signature','A flash of red at the heel','The red band wraps around the heel, where the BIG K emblem sits below the black pull tab.','Rear view of the red heel band, BIG K emblem and black pull tab'],
      ['Puffsole','A closer look at the tread','The black outsole has raised blocks with fine ridges and the BIG K emblem worked into the tread.','Black outsole with ridged blocks and BIG K emblems'],
    ],
  },
  nl: {
    description: 'Blauwgroene panelen, beige textiel en een felrode hiel geven de B10 Green de uitstraling van een retro hardloopschoen. De zachte Memory Foam-binnenzool en lichte zool maken hem comfortabel voor elke dag.',
    details: 'Lage vetersneaker met blauwgroene panelen, beige textiel, een rode hielband en een zwarte profielzool. Het rode accent loopt door op de witte tussenzool.',
    caption: 'Bekijk de B10 Green van dichtbij, van de Memory Foam-binnenzool tot het gelaagde bovenwerk en de kenmerkende rode hiel.',
    features: [
      ['Memory Foam','Zachte demping onder je voet','De Memory Foam-binnenzool geeft je voet een zachte laag demping bij dagelijks gebruik.','Beige binnenzool van de B10 Green met het opschrift Memory Foam'],
      ['Gelaagd bovenwerk','Blauwgroen omlijst het beige textiel','De blauwgroene panelen volgen de neus, de veterogen en de hiel. Daartussen zie je het beige textiel met structuur.','Zijaanzicht van de B10 Green met blauwgroene panelen en beige textiel'],
      ['BIG K-signatuur','Een rood accent rond de hiel','De rode band loopt rond de hiel. Aan de achterkant staat het BIG K-embleem onder de zwarte treklus.','Achteraanzicht van de rode hielband, het BIG K-embleem en de zwarte treklus'],
      ['Puffsole','Het zoolprofiel van dichtbij','De zwarte buitenzool heeft verhoogde profielblokken met fijne ribbels en het BIG K-embleem in het profiel.','Zwarte buitenzool met geribbelde profielblokken en BIG K-emblemen'],
    ],
  },
  fr: {
    description: 'Des empiècements vert canard, un textile beige et un talon rouge vif donnent à la B10 Green une allure de running rétro. Sa semelle intérieure souple en mousse à mémoire de forme et sa semelle légère offrent un chaussant confortable au quotidien.',
    details: 'Basket basse à lacets, avec des empiècements vert canard, un textile beige, une bande rouge au talon et une semelle d’usure noire à relief. Une touche de rouge se prolonge sur la semelle intermédiaire blanche.',
    caption: 'Découvrez la B10 Green en gros plan, de la semelle intérieure Memory Foam à la tige à empiècements et au talon rouge emblématique.',
    features: [
      ['Memory Foam','Un amorti souple sous le pied','La semelle intérieure en mousse à mémoire de forme apporte un amorti souple au quotidien.','Semelle intérieure beige de la B10 Green, marquée Memory Foam'],
      ['Tige à empiècements','Le vert canard souligne le textile beige','Les empiècements vert canard suivent le bout, les œillets et le talon et encadrent le textile beige texturé.','Vue de profil de la B10 Green, avec ses empiècements vert canard et son textile beige'],
      ['Signature BIG K','Une touche de rouge au talon','La bande rouge enveloppe le talon. À l’arrière, l’emblème BIG K se trouve sous la tirette noire.','Vue arrière de la bande rouge, de l’emblème BIG K et de la tirette noire'],
      ['Puffsole','Le relief de la semelle en détail','La semelle d’usure noire présente des blocs en relief finement striés, ponctués de l’emblème BIG K.','Semelle d’usure noire avec blocs striés et emblèmes BIG K'],
    ],
  },
  es: {
    description: 'Las piezas en verde azulado, el tejido beige y el talón rojo intenso dan a las B10 Green un aire de zapatilla de running retro. La plantilla suave de espuma viscoelástica y la suela ligera aportan comodidad en el día a día.',
    details: 'Zapatilla baja de cordones con piezas en verde azulado, tejido beige, una banda roja en el talón y una suela negra con relieve. El detalle rojo continúa en la entresuela blanca.',
    caption: 'Descubre de cerca las B10 Green, desde la plantilla Memory Foam hasta el exterior por capas y el característico talón rojo.',
    features: [
      ['Memory Foam','Amortiguación suave bajo el pie','La plantilla de espuma viscoelástica añade una capa de amortiguación suave para el uso diario.','Plantilla beige de las B10 Green con la inscripción Memory Foam'],
      ['Exterior por capas','Verde azulado sobre tejido beige','Las piezas en verde azulado recorren la puntera, los ojales y el talón y enmarcan el tejido beige con relieve.','Vista lateral de las B10 Green con piezas en verde azulado y tejido beige'],
      ['Firma BIG K','Un toque de rojo en el talón','La banda roja rodea el talón. En la parte trasera, el emblema BIG K queda justo debajo del tirador negro.','Vista trasera de la banda roja, el emblema BIG K y el tirador negro'],
      ['Puffsole','El dibujo de la suela de cerca','La suela exterior negra tiene bloques en relieve con estrías finas y el emblema BIG K integrado en el dibujo.','Suela negra con bloques estriados y emblemas BIG K'],
    ],
  },
  it: {
    description: 'Inserti verde petrolio, tessuto beige e un tallone rosso acceso danno alle B10 Green il look di una scarpa da running rétro. Il morbido sottopiede in Memory Foam e la suola leggera le rendono comode tutti i giorni.',
    details: 'Sneaker bassa con lacci, inserti verde petrolio, tessuto beige, fascia rossa al tallone e battistrada nero. Il dettaglio rosso prosegue sull’intersuola bianca.',
    caption: 'Scopri da vicino la B10 Green, dal sottopiede in Memory Foam alla tomaia a strati e all’inconfondibile tallone rosso.',
    features: [
      ['Memory Foam','Una morbida ammortizzazione','Il sottopiede in Memory Foam aggiunge uno strato di morbida ammortizzazione per tutti i giorni.','Sottopiede beige della B10 Green con la scritta Memory Foam'],
      ['Tomaia a strati','Il verde petrolio incornicia il beige','Gli inserti verde petrolio seguono la punta, gli occhielli e il tallone e incorniciano il tessuto beige strutturato.','Profilo della B10 Green con inserti verde petrolio e tessuto beige'],
      ['Firma BIG K','Un tocco di rosso al tallone','La fascia rossa avvolge il tallone. Sul retro, lo stemma BIG K si trova sotto il passante nero.','Vista posteriore della fascia rossa, dello stemma BIG K e del passante nero'],
      ['Puffsole','Il battistrada da vicino','Il battistrada nero presenta tasselli in rilievo con sottili scanalature e lo stemma BIG K integrato nel disegno.','Battistrada nero con tasselli scanalati e stemmi BIG K'],
    ],
  },
};

export function b10ColourProductCopy(product: Product, colour: string | undefined, locale: SiteLocale): Product {
  if (product.id !== 'B10' || (colour !== 'White' && colour !== 'Green')) return product;
  const green = colour === 'Green';
  const white = whiteCopy[locale];
  const copy = green ? {...white, ...greenCopy[locale], seoTitle: white.seoTitle.replace('B10 White','B10 Green')} : white;
  const photos = green ? greenPhotos : whitePhotos;
  const {features, caption, sizeGuide, sizeLabel, ...text} = copy;
  const source = product.content?.presentation;
  const hasDetailPhotos = photos.every(image => product.images.includes(image));
  const presentation = source?.enabled && hasDetailPhotos ? {
    ...source,
    introduction: text.description,
    detailCaption: caption,
    sizeGuide,
    sizeTable: source.sizeTable.replace(/^[^\r\n]+/, 'EU\t'+sizeLabel),
    features: features.map(([name, heading, description, alt], index) => ({
      id: 'b10-'+colour.toLowerCase()+'-'+index, name, heading, description, alt, kind: 'feature' as const, image: photos[index],
    })),
  } : undefined;
  return applyProductCopy(product, {...text, seoDescription: text.description, ...(presentation ? {presentation} : {})});
}
