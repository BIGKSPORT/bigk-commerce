import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const css = ['globals','identity','storefront-polish']
  .map(name => readFileSync(new URL('../app/'+name+'.css',import.meta.url),'utf8')).join('\n');
const browser = await chromium.launch({
  executablePath:process.env.CHROMIUM_PATH,
  args:['--no-sandbox'],
});

try {
  for (const viewport of [{width:1280,height:700},{width:390,height:680}]) {
    const page = await browser.newPage({viewport});
    const fields = Array.from({length:24},(_,i)=>'<p><label>Field '+i+' <input></label></p>').join('');
    for (const [title,classes,editor] of [
      ['Customer profile','modal wide',false],
      ['Your bag','modal',false],
      ['Shared product','modal wide',false],
      ['Product editor','modal wide admin-editor-modal',true],
    ]) {
      const form = '<div class="bo-panel">'+fields+'<button type="button">Last action</button></div>';
      const content = editor
        ? '<div class="admin-product-editor"><div class="admin-editor-body">'+form+'</div></div>'
        : form;
      await page.setContent('<!doctype html><dialog class="'+classes+'"><div class="modal-heading"><h2>'+
        title+'</h2><button autofocus type="button">Close</button></div>'+content+'</dialog>');
      await page.addStyleTag({content:css});
      await page.locator('dialog').evaluate(dialog=>dialog.showModal());
      const scroller = page.locator(editor ? '.admin-editor-body' : 'dialog');
      const box = await scroller.boundingBox();
      assert(box);
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
      await page.mouse.wheel(0,2500);
      const last = page.getByRole('button',{name:'Last action'});
      await last.waitFor();
      await page.waitForFunction(({selector})=>{
        const area = document.querySelector(selector);
        const button = document.querySelector('.bo-panel button');
        return area.scrollTop>0 && button.getBoundingClientRect().bottom<=area.getBoundingClientRect().bottom;
      },{selector:editor ? '.admin-editor-body' : 'dialog'},{timeout:2500});
      assert.equal(await page.evaluate(()=>window.scrollY),0);
      console.log('PASS '+title+' scrolls to its last action at '+viewport.width+'px');
    }
    await page.close();
  }
} finally {
  await browser.close();
}
