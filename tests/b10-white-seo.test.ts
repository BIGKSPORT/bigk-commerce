import {test} from 'node:test';
import assert from 'node:assert/strict';
import {b10Product} from '../lib/b10';
import {resolveGroupSelection} from '../lib/product-group-routing';
import {groupUrl} from '../lib/product-groups';
import {publicUrlReserved} from '../lib/product-public-urls';

test('B10 White has a standalone canonical while existing colour links preserve size and attribution', () => {
  const product = b10Product();
  const catalog = [product];
  const legacy = resolveGroupSelection(catalog,catalog,product.slug,{colour:'white',size:'42',...{utm_source:'campaign'}});
  assert.equal(legacy?.canonical,'/products/b10-white');
  assert.equal(legacy?.redirect,'/products/b10-white?size=42&utm_source=campaign');
  const current = resolveGroupSelection(catalog,catalog,'b10-white',{size:'42'});
  assert.equal(current?.canonical,'/products/b10-white');
  assert.equal(current?.groupSlug,product.slug);
  assert.equal(current?.selected.colour,'White');
  assert.equal(current?.redirect,undefined);
  assert.equal(groupUrl(catalog,current!.selected,'42'),'/products/b10-white?size=42');

  for (const colour of ['Black','Green']) {
    const other = resolveGroupSelection(catalog,catalog,product.slug,{colour});
    assert.equal(other?.canonical,'/products/b10-sneakers');
    assert.equal(other?.redirect,undefined);
  }
  assert.equal(publicUrlReserved('b10-white',catalog,'another-product'),true);
  const collision = {...product,id:'different',slug:'b10-white'};
  const withCollision = [...catalog,collision];
  assert.equal(resolveGroupSelection(withCollision,withCollision,product.slug,{colour:'White'})?.canonical,'/products/b10-sneakers');
  assert.match(groupUrl(withCollision,current!.selected),/\?colour=White$/);
});
