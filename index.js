const puppeteer = require('puppeteer');
const merge = require('easy-pdf-merge');

const pdfFiles = [];

puppeteer.launch().then(async browser => {
  try {
    const page = await browser.newPage();
    //    await page.setDefaultNavigationTimeout(0);
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36',
    );

    await login(page);
    await page.goto(process.env.TARGET, {waitUntil: 'networkidle2'});

    console.log('preparing to read!');
    for (let i = 0; i < 10; i++) {
      const pdfFileName = `page-${i}.pdf`;
      console.log('processing: ', pdfFileName);
      pdfFiles.push(pdfFileName);

      console.log('scrolling...');
      await scrollToBottom(page);
      await page.pdf({
        path: pdfFileName,
        format: 'A4',
      });

      try {
        console.log('navigating to next page...');
        await page.waitForSelector('.next.nav-link');
        await page.click('.next.nav-link');
        await page.waitForNavigation();
      } catch (e) {
        console.log('something went wrong navigating: ', e);
      }
    }
    await mergePages(pdfFiles);
  } catch (e) {
    console.log('error: ', e);
  } finally {
    await browser.close();
  }
});

const mergePages = pdfFiles => {
  return new Promise((resolve, reject) => {
    merge(pdfFiles, 'final.pdf', function(e) {
      if (e) {
        console.log(e);
        reject(e);
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

async function login(page) {
  try {
    await page.goto('https://learning.oreilly.com', {
      waitUntil: 'networkidle2',
    });
    await page.waitForSelector('input[name=email]', {visible: true});
    await page.type('input[name=email]', process.env.EMAIL);

    await page.waitForSelector('input[name=password]', {visible: true});
    await page.type('input[name=password]', process.env.PASS);

    await page.waitForSelector('button', {visible: true});
    await page.click('button');

    await page.waitForNavigation();
  } catch (e) {
    throw new Error('trouble logging in');
  }
}
