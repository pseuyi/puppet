const puppeteer = require('puppeteer');
const merge = require('easy-pdf-merge');

const pdfFiles = [];

puppeteer.launch().then(async browser => {
  try {
    const page = await browser.newPage();

    await login(page);
    await page.goto(process.env.TARGET, {waitUntil: 'networkidle2'});

    await page.addStyleTag({path: './scratch.css'});

    console.log('preparing to read!');
    await processChapters(page);

    await mergePages(pdfFiles);
  } catch (e) {
    console.log('error: ', e);
  } finally {
    await browser.close();
  }
});

const mergePages = pdfFiles => {
  return new Promise((resolve, reject) => {
    merge(pdfFiles, 'final.pdf', e => {
      if (e) {
        console.log(e);
        reject(e);
      }

      console.log('finished merging pdfs');
      resolve();
    });
  });
};

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

async function processChapters(page) {
  let chNum = 0;
  while (await page.waitForSelector('.next.nav-link')) {
    // do the stuff
    const pdfFileName = `ch${chNum}.pdf`;
    pdfFiles.push(pdfFileName);

    await page.pdf({
      path: pdfFileName,
      format: 'A4',
    });

    chNum++;
    await navigateToNext(page);
  }
}

async function navigateToNext(page) {
  try {
    console.log('navigating to next page...');
    await page.evaluate(() => {
      document.querySelector('.next.nav-link').click();
    });
    await page.waitForNavigation({timeout: 8000});
  } catch (e) {
    console.log('something went wrong navigating: ', e);
  }
}

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
