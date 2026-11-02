import assert from 'node:assert/strict';
import {careCopy,careSymbols} from '../lib/i18n/care';
import {locales} from '../lib/i18n/config';
// JSX imports a CSS module, so pure data and semantic SVG structure are checked separately in the browser.
for(const locale of locales){const copy=careCopy[locale];assert.equal(Object.keys(copy.instructions).length,5);assert(careSymbols.every(symbol=>copy.instructions[symbol].length>0));assert(!/[\u3400-\u9fff]/.test(JSON.stringify(copy)));assert(copy.instructions['wash-30'].includes('30°C'));assert(copy.instructions['iron-low'].includes('110°C'));assert(copy.instructions['similar-colours'].includes('30'));}
assert.deepEqual(Object.values(careCopy.en.instructions),['Machine wash at 30°C, inside out','Wash with similar colors. Maximum wash cycle: 30 minutes','Do not bleach. Dry away from direct sunlight','Iron at low temperature, maximum 110°C','Do not tumble dry']);
console.log('PASS five owner-approved instructions and additional advice in English, Dutch, French and German.');
