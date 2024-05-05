import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {

    // Create a browser instance
    const browser = await puppeteer.launch();
  
    // Create a new page
    const page = await browser.newPage();
  
    // Website URL to export as pdf
    const html = fs.readFileSync('index2.html', 'utf-8');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
  
    //To reflect CSS used for screens instead of print
    await page.emulateMediaType('screen');
  
  // Downlaod the PDF
    const pdf = await page.pdf({
      path: 'result1.pdf',
      margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
      printBackground: true,
      format: 'A4',
    });
  
    // Close the browser instance
    await browser.close();
  })();
