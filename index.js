const puppeteer = require('puppeteer');
const merge = require('easy-pdf-merge');

const wsChromeEndpoint =
  'ws://127.0.0.1:9222/devtools/browser/6ca1fd42-c38f-4d8c-b49d-50c847fa51cb';

const pdfUrls = [
  'https://learning.oreilly.com/library/view/programming-typescript/9781492037644/ch01.html',
  'https://learning.oreilly.com/library/view/programming-typescript/9781492037644/ch02.html',
];
const pdfFiles = [];

puppeteer
  .connect({
    browserWSEndpoint: wsChromeEndpoint,
  })
  .then(async browser => {
    const page = await browser.newPage();

    for (let i = 0; i < pdfUrls.length; i++) {
      console.log('opening up page #', i);
      await page.goto(pdfUrls[i], {waitUntil: 'networkidle2'});
      // await page.setViewport({width: 1280, height: 1024, deviceScaleFactor: 1});
      // page.emulateMedia('print');
      //
      const pdfFileName = `page-${i}.pdf`;
      pdfFiles.push(pdfFileName);

      /*
    hack for pptr.dev docs
    page.addStyleTag({
      content: 'content-component {overflow-y: initial !important}',
    });
    */

      await scrollToBottom(page);

      await page.pdf({
        path: pdfFileName,
        format: 'A4',
      });

      await page.screenshot({path: 'test.png', fullPage: true});
    }

    //  await browser.close();
    await mergePages(pdfFiles);
  });

const mergePages = pdfFiles => {
  return new Promise((resolve, reject) => {
    merge(pdfFiles, 'final.pdf', function(err) {
      if (err) {
        console.log(err);
        reject(err);
      }

      console.log('finished merging pdfs');
      resolve();
    });
  });
};

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    let currHeight = 0;
    const innerHeight = window.innerHeight;
    const scrollHeight = document.body.scrollHeight;

    await new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        window.scrollBy(0, innerHeight);
        currHeight += innerHeight;

        if (currHeight >= scrollHeight) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  });
}
