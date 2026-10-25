import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1200,height:860}});page.on('pageerror',e=>console.log('PAGE',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});page.on('requestfailed',r=>console.log('REQUEST',r.url(),r.failure()));
await page.goto('http://127.0.0.1:5191/Patrol-review.html');await page.waitForFunction(()=>window.review?.ready,null,{timeout:90000});
await page.addStyleTag({content:'header,nav,#mode,#note,#pose{display:none}'});mkdirSync('preview',{recursive:true});
for(const [model,view] of [['original','hero'],['proposed','hero'],['proposed','detail'],['proposed','roof']]){
 await page.evaluate(({model,view})=>{window.review.select(model);window.review.view(view);},{model,view});
 await page.screenshot({path:`preview/${model}-${view}.png`});console.log(model,view);
}
await browser.close();
