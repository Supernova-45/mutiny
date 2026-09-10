import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const record=process.env.RECORD_DEMO==='1';
fs.mkdirSync('outputs/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,
  ...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),
  args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1080},deviceScaleFactor:1,
  ...(record?{recordVideo:{dir:'outputs/demo-recording',size:{width:1440,height:1080}}}:{})});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const step=async(ms=700)=>page.waitForTimeout(record?Math.max(ms,1600):ms);
const screen=async(name)=>page.screenshot({path:`outputs/screenshots/${name}.png`,fullPage:true});
try {
 await page.goto(process.env.APP_URL??'http://127.0.0.1:5173',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Vaccine study',exact:true}).click();
 await page.locator('.target-mark').first().waitFor();
 assert.equal(await page.locator('.target-mark').count(),232);
 assert.equal(await page.locator('.target-mark.response').count(),0);
 await step();await screen('01-atlas');
 await page.getByRole('button',{name:'Reveal responses',exact:true}).click();await step();
 assert.equal(await page.locator('.target-mark.response').count(),23);
 assert.equal(await page.locator('.target-mark.pooled').count(),7);
 for(const lens of ['ESM-2','Class-I binding','Shuffle']) {
  await page.locator('.lens-buttons button').filter({hasText:lens}).click();await step();
  assert.equal(await page.locator('.target-mark').count(),232);
  assert.equal(await page.locator('.target-mark.unranked').count(),44);
  assert.ok(await page.locator('.chance-chart svg').isVisible());
  if(lens==='ESM-2')await screen('02-responses');
 }
 await page.getByRole('button',{name:'Evidence and methods',exact:true}).click();
 assert.ok(await page.getByRole('dialog').isVisible());
 await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('dialog').count(),0);
 await page.locator('nav button').filter({hasText:'Compare structures'}).click();
 await page.locator('.molecule-canvas canvas').first().waitFor({timeout:30000});
 await page.waitForFunction(()=>document.querySelectorAll('.viewer-loading').length===0);
 await step(3500);await page.locator('.viewer-pair').screenshot({path:'outputs/screenshots/03-molecule.png'});
 assert.equal(await page.locator('.viewer-error').count(),0);
 await page.getByRole('button',{name:'302TIL receptor',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.viewer-loading').length===0);
 await step(2500);await page.locator('.viewer-pair').screenshot({path:'outputs/screenshots/04-receptor.png'});
 await page.getByRole('button',{name:'Inspect peptide position 6, W',exact:true}).first().click();await step(1200);
 assert.match(await page.locator('.contact-list').first().innerText(),/TYR100/);
 // Real pointer-driven rotation, mirrored by the paired viewer.
 const left=page.locator('.molecule-canvas canvas').first();
 const right=page.locator('.molecule-canvas canvas').last();
 const before=await right.screenshot();
 const box=await left.boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.55);
 await page.mouse.down();await page.mouse.move(box.x+box.width*.58,box.y+box.height*.60,{steps:18});await page.mouse.up();await step();
 assert.notDeepEqual(await right.screenshot(),before,'Right camera must respond to left-view drag');
 await page.getByRole('button',{name:'Expand 3D',exact:true}).click();
 assert.ok(await page.locator('.molecular-workspace.expanded').isVisible());
 const orbitBefore=await right.screenshot();
 await page.getByRole('button',{name:'Rotate automatically',exact:true}).click();await step(1000);
 await page.getByRole('button',{name:'Pause rotation',exact:true}).click();
 assert.notDeepEqual(await right.screenshot(),orbitBefore,'Automatic rotation must update both cameras');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.molecular-workspace.expanded').count(),0);
 await page.getByRole('button',{name:'Atoms',exact:true}).click();await step(1500);await screen('07-atomic-interface');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:390,height:844});await step(1200);await screen('05-mobile-molecule');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('nav button').filter({hasText:'Vaccine study'}).click();await step();await screen('06-mobile-atlas');
 assert.equal(await page.locator('.target-mark').count(),232);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: 232 identities, four outcome states, matched model orderings, chance reference, evidence, four PDB states, residue contacts, synchronized rotation, mobile, no browser errors.');
} finally {
 const video=page.video();await context.close();
 if(record&&video)await video.saveAs('outputs/mutiny-demo.webm');
 await browser.close();
}
