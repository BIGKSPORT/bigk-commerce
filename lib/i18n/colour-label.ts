import type {SiteLocale} from './site-routing';

const colours: Record<string, Record<Exclude<SiteLocale, 'en'>, string>> = {
 black: {nl:'Zwart', fr:'Noir', es:'Negro', it:'Nero'},
 white: {nl:'Wit', fr:'Blanc', es:'Blanco', it:'Bianco'},
 red: {nl:'Rood', fr:'Rouge', es:'Rojo', it:'Rosso'},
 green: {nl:'Groen', fr:'Vert', es:'Verde', it:'Verde'},
 blue: {nl:'Blauw', fr:'Bleu', es:'Azul', it:'Blu'},
 'dusty blue': {nl:'Vergrijsd blauw', fr:'Bleu grisé', es:'Azul grisáceo', it:'Blu polvere'},
 cream: {nl:'Crème', fr:'Crème', es:'Crema', it:'Crema'},
 beige: {nl:'Beige', fr:'Beige', es:'Beige', it:'Beige'},
 emerald: {nl:'Smaragdgroen', fr:'Vert émeraude', es:'Verde esmeralda', it:'Verde smeraldo'},
 'colour to confirm': {nl:'Kleur nog te bevestigen', fr:'Couleur à confirmer', es:'Color por confirmar', it:'Colore da confermare'},
};
colours['emerald green'] = colours.emerald;

export function localizedColourLabel(colour: string, locale: SiteLocale): string {
 if (locale === 'en') return colour;
 return colour.split(/\s*\/\s*|(?<=black|cream)-(?=black|cream)/i)
  .map(part => colours[part.trim().toLowerCase()]?.[locale] ?? part)
  .join(' / ');
}
