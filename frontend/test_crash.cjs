const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    // Navigate to dashboard which redirects to login
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    
    // Login
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for Dashboard
    await page.waitForSelector('button', { timeout: 5000 });
    // Assume patient 1 is in the list, or just navigate directly to clinical workspace
    await page.goto('http://localhost:5173/patient/1/clinic');
    
    // Wait for add problem button
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('+ Añadir'));
    }, { timeout: 5000 });
    
    console.log("Found button, clicking...");
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('+ Añadir'));
      if (btn) btn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Done checking");
  } catch (err) {
    console.error("Test failed", err);
  } finally {
    await browser.close();
  }
})();
