import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,
  ...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),
  args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1080}});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const screen=async name=>page.screenshot({path:`outputs/screenshots/${name}.png`,fullPage:true});
const loaded=()=>page.waitForFunction(()=>document.querySelectorAll('.molecule-canvas canvas').length===2&&document.querySelectorAll('.structure-stage[data-ready=true]').length===2);
try{
 await page.goto(process.env.APP_URL??'http://127.0.0.1:5173',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Your candidates',exact:true}).click();
 await page.getByRole('button',{name:'Explore 11 published candidates',exact:true}).click();
 await page.locator('.rank-entry').first().waitFor();assert.equal(await page.locator('.rank-entry').count(),22);
 assert.match(await page.locator('.review-scope').innerText(),/No response outcomes/);
 const option=await page.locator('.candidate-select option').nth(3).getAttribute('value');
 await page.locator('.candidate-select select').selectOption(option);
 await page.getByRole('textbox',{name:'Candidate notes'}).fill('Check the allele against the paper.');
 await page.getByRole('combobox',{name:'Review status'}).selectOption('investigate');
 await page.getByRole('slider').fill('3');
 // Navigating away and back must preserve unsaved review state.
 await page.getByRole('button',{name:'The vaccines',exact:true}).click();
 await page.getByRole('button',{name:'Your candidates',exact:true}).click();
 assert.equal(await page.getByRole('textbox',{name:'Candidate notes'}).inputValue(),'Check the allele against the paper.');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save project',exact:true}).click();
 const download=await downloadPromise;const text=fs.readFileSync(await download.path(),'utf8'),saved=JSON.parse(text);
 assert.equal(saved.candidates.length,11);assert.equal(saved.view.inspectedCount,3);
 await page.getByRole('textbox',{name:'Candidate notes'}).fill('Temporary unsaved change');
 const requests=[];const observe=r=>requests.push({url:r.url(),method:r.method(),body:r.postData()});page.on('request',observe);
 await page.locator('input[type=file]').setInputFiles({name:'review.project.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await page.waitForTimeout(250);
 assert.equal(await page.getByRole('textbox',{name:'Candidate notes'}).inputValue(),'Check the allele against the paper.');
 assert.equal(await page.getByRole('combobox',{name:'Review status'}).inputValue(),'investigate');
 assert.equal(await page.locator('.candidate-select select').inputValue(),option);
 await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":"99"}')});
 await page.getByRole('alert').waitFor();assert.equal(await page.locator('.rank-entry').count(),22);
 assert.equal(await page.getByRole('textbox',{name:'Candidate notes'}).inputValue(),'Check the allele against the paper.');
 page.off('request',observe);assert.deepEqual(requests,[],'Local imports must not make network requests');
 await page.locator('input[type=file]').setInputFiles({name:'review.project.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await screen('08-research-review');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await screen('09-mobile-research');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:1440,height:1080});
 await page.getByRole('button',{name:'Recognition',exact:true}).click();await loaded();
 await page.getByRole('button',{name:'The neighboring shape W6',exact:true}).click();await loaded();
 assert.match(await page.locator('.geometry-strip').innerText(),/2.99 Å/);assert.match(await page.locator('.geometry-strip').innerText(),/1.02 Å/);
 await page.waitForTimeout(600);await screen('10-w6-comparison');
 await page.getByRole('button',{name:'W6 analogue',exact:true}).click();await loaded();
 assert.match(await page.locator('.experiment-result').innerText(),/weakens binding/);
 assert.equal(await page.locator('.binding-row.selected').count(),2);
 assert.equal(await page.locator('.binding-row.selected .binding-dot').count(),2);
 assert.match(await page.locator('.structure-title').first().innerText(),/6UK2/);assert.match(await page.locator('.structure-title').last().innerText(),/6UK4/);
 await page.getByRole('button',{name:'W6 alanine',exact:true}).click();await loaded();
 assert.equal(await page.locator('.binding-row.selected .binding-dot').count(),0);
 assert.match(await page.locator('.experiment-caveat').innerText(),/original normal and mutant/);
 await page.getByRole('button',{name:'W6 analogue',exact:true}).click();await loaded();await page.waitForTimeout(600);await screen('11-test-the-contact');
 await page.locator('.binding-experiment').screenshot({path:'outputs/screenshots/12-binding-experiment.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await screen('13-mobile-experiment');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal(await page.locator('.viewer-error').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: local import, declared rankings, saved notes/view round trip, invalid import retention, no import network requests, navigation persistence, W6 reference structures, source-bound perturbation controls, censored values, desktop/mobile, no browser errors.');
}catch(error){
 await page.screenshot({path:'work/research-browser-failure.png',fullPage:true});
 console.error('Browser diagnostics:',await page.locator('.viewer-error,.viewer-loading').allTextContents(), 'canvas count:',await page.locator('.molecule-canvas canvas').count(), 'page errors:',errors);
 throw error;
}finally{await context.close();await browser.close()}
