import {test} from 'node:test';
import assert from 'node:assert/strict';
import {b10Product} from '../lib/b10';
import {b10WhiteProductCopy} from '../lib/b10-white-copy';
import {siteLocales} from '../lib/i18n/site-routing';
import {parseSizeTable,presentationSchema} from '../lib/product-presentation';

test('B10 White uses the live colour detail images and complete localized specifications', () => {
  const base = b10Product();
  base.images.push(...[
    '832b1b734ce29ac4d324c7c1e8c00771d53f47fc4be7676f57971e049b43c673',
    '0fb4c020408442f4022b6e839fcd0b99aa60c33d6e5188a2507c62f4a19e0dac',
    '7b24811c1b3bd4fe31c1f943bf4b72023eef0fff724ea055e7db6ed6ff50689f',
    '2ab7210ea2f88bf0319668265ca5e9b9043a9bb4e6780708ea74e8627519dc08',
  ].map(id => '/api/media/'+id+'.webp'));
  const descriptions = new Set<string>();
  for (const locale of siteLocales) {
    const translated = b10WhiteProductCopy(base, 'White', locale);
    descriptions.add(translated.description);
    assert.match(translated.content!.trade!.seoTitle!, /B10 White/);
    assert.equal(translated.content!.localizedCopy!.seoDescription, translated.description);
    assert.equal(translated.content!.composition.split('\n').length, 3);
    assert.ok(translated.content!.fit && translated.content!.care && translated.content!.details);
    const presentation = presentationSchema.parse(translated.content!.presentation);
    assert.equal(presentation.features.length, 4);
    assert.ok(presentation.features.every(feature => base.images.includes(feature.image) && feature.alt));
    assert.deepEqual(parseSizeTable(presentation.sizeTable).slice(1), parseSizeTable(base.content!.presentation!.sizeTable).slice(1));
    assert.equal(b10WhiteProductCopy(base, 'Black', locale), base);
    assert.equal(b10WhiteProductCopy(base, 'Green', locale), base);
    assert.equal(translated.variants, base.variants);
  }
  assert.equal(descriptions.size, siteLocales.length);
});
