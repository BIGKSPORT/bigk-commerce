import {splitShippingAddress} from './myparcel-orders';
import {HttpError} from './security';

type TikTokAddress = {
 region_code: string;
 name: string;
 postal_code: string;
 address_line1: string;
 address_line2?: string;
 address_line3?: string;
 address_line4?: string;
 district_info: {address_level: string; address_level_name?: string; address_name: string}[];
};

export function tiktokShippingAddress(address: TikTokAddress) {
 const locality = /^(city|town|municipality|ville|commune|stad|gemeente|plaats|locality|postal city|post town)$/i;
 const cities = [...new Set(address.district_info.filter(part =>
  locality.test(part.address_level_name || part.address_level)).map(part => part.address_name))];
 if (cities.length !== 1) throw new HttpError(409, 'TikTok geeft geen eenduidige gemeente door. Er is geen zending aangemaakt.');

 let {street, number} = splitShippingAddress(address.address_line1);
 let second = address.address_line2 || '';
 const inlineUnit = address.address_line1.match(/^(.+?\s+\d+[a-z]?)\s+((?:bus|bte|bo[iî]te|box|apt\.?|app\.?|unit)\s*[:.]?\s*[a-z0-9-]{1,20})$/i);
 if (inlineUnit && !second) {
  ({street, number} = splitShippingAddress(inlineUnit[1]));
  second = inlineUnit[2];
 }
 const leadingNumber = street.match(/^(\d+[a-z]?)\s+([\p{L}].*)$/iu);
 if (!number && leadingNumber) [,number,street] = leadingNumber;
 let boxNumber = '';
 if (!number && /^\d+[a-z]?(?:[-/]\d+[a-z]?)?$/i.test(second)) {
  number = second;
 } else if (second) {
  const box = second.match(/^(?:bus|bte|bo[iî]te|box|apt\.?|app\.?|unit)\s*[:.]?\s*([a-z0-9-]{1,20})$/i);
  if (!number || !box) throw new HttpError(409, 'De tweede TikTok-adresregel kon niet eenduidig worden verwerkt. Er is geen zending aangemaakt.');
  boxNumber = box[1];
 }
 if (!number || !street || address.address_line3 || address.address_line4) {
  throw new HttpError(409, 'TikTok geeft geen eenduidige straat en huisnummer door. Er is geen zending aangemaakt.');
 }
 const city = cities[0];
 const postal = address.postal_code.toUpperCase().replace(/\s+/g, '');
 if (!(address.region_code === 'BE' ? /^\d{4}$/ : /^\d{4}[A-Z]{2}$/).test(postal)
     || [street, address.name, city].some(value => /[*•]/.test(value))) {
  throw new HttpError(409, 'TikTok geeft een afgeschermd adres of ongeldige postcode door. Er is geen zending aangemaakt.');
 }
 return {cc: address.region_code, person: address.name, postal_code: postal, city, street, number, ...(boxNumber ? {box_number: boxNumber} : {})};
}
