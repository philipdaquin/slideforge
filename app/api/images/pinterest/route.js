import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

// Pinterest credentials
const PINTEREST_EMAIL = 'miniclawd@proton.me';
const PINTEREST_PASSWORD = 'Miniclawd2026!SecurePaw';

// Cookie file path for session persistence
const COOKIE_FILE = '/tmp/pinterest-cookies.json';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter. Use ?q=your-search-term' }, { status: 400 });
  }

  let browser;
  try {
    // Launch browser with longer timeout
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });
    
    // Try to load cookies if they exist
    try {
      const fs = require('fs');
      if (fs.existsSync(COOKIE_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
        await context.addCookies(cookies);
        console.log('Loaded cookies from file');
      }
    } catch (e) {
      console.log('No cookies file, starting fresh');
    }
    
    const page = await context.newPage();
    
    // Set default timeout to 60 seconds
    page.setDefaultTimeout(60000);
    
    // Navigate directly to search results - this is faster
    console.log('Navigating to Pinterest search for:', query);
    const searchUrl = `https://www.pinterest.com/search/?q=${encodeURIComponent(query)}&rs=typed`;
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      // If that fails, try the main page
      console.log('Direct search failed, trying home page...');
      await page.goto('https://www.pinterest.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    
    // Wait for content to start loading
    await page.waitForTimeout(3000);
    
    // Check if we need to login by looking for login forms
    const needsLogin = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      return body.includes('log in') && body.includes('sign in');
    });
    
    if (needsLogin) {
      console.log('Need to log in to Pinterest...');
      
      // Click login button
      await page.click('button:has-text("Log in"), a:has-text("Log in")').catch(() => {});
      await page.waitForTimeout(2000);
      
      // Enter email
      const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 }).catch(() => null);
      if (emailInput) {
        await emailInput.fill(PINTEREST_EMAIL);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        // Enter password
        const passwordInput = await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 10000 }).catch(() => null);
        if (passwordInput) {
          await passwordInput.fill(PINTEREST_PASSWORD);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(5000);
        }
      }
      
      // Save cookies
      try {
        const fs = require('fs');
        const cookies = await context.cookies();
        fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies));
        console.log('Saved cookies');
      } catch (e) {}
      
      // Now navigate to search
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
    }
    
    // Scroll down to load more images
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(1000);
    }
    
    // Extract image URLs
    const images = await page.evaluate(() => {
      const urls = new Set();
      
      // Get all images
      const imgElements = document.querySelectorAll('img');
      imgElements.forEach(img => {
        let src = img.src || img.getAttribute('data-src') || img.getAttribute('srcset')?.split(',')[0]?.split(' ')[0];
        
        if (src && src.startsWith('http') && src.includes('pinimg')) {
          // Filter out avatars
          if (!src.includes('avatar') && !src.includes('profile') && !src.includes('user')) {
            // Convert to larger size - Pinterest sizes: 60x, 75x, 170x, 236x, 564x, 736x
            let largerUrl = src;
            if (src.includes('/60x60/')) {
              largerUrl = src.replace('/60x60/', '/564x/');
            } else if (src.includes('/75x75/')) {
              largerUrl = src.replace('/75x75/', '/564x/');
            } else if (src.includes('/170x/')) {
              largerUrl = src.replace('/170x/', '/564x/');
            } else if (src.includes('/236x/')) {
              largerUrl = src.replace('/236x/', '/564x/');
            }
            urls.add(largerUrl);
          }
        }
      });
      
      // Get images from pin elements via data attributes
      const pinImages = document.querySelectorAll('[data-test-id="pin-image"], [class*="pin"]');
      pinImages.forEach(el => {
        const img = el.querySelector('img');
        if (img) {
          let src = img.src || img.getAttribute('data-src');
          if (src && src.startsWith('http') && src.includes('pinimg') && !src.includes('avatar')) {
            if (src.includes('/60x60/')) {
              src = src.replace('/60x60/', '/564x/');
            } else if (src.includes('/236x/')) {
              src = src.replace('/236x/', '/564x/');
            }
            urls.add(src);
          }
        }
      });
      
      return Array.from(urls);
    });
    
    console.log(`Found ${images.length} images`);
    
    // Filter to unique URLs and limit
    const uniqueImages = [...new Set(images)]
      .filter(url => url && url.length > 50)
      .slice(0, 20);
    
    await browser.close();
    
    return NextResponse.json({ 
      success: true, 
      query,
      images: uniqueImages,
      count: uniqueImages.length
    });
    
  } catch (error) {
    console.error('Pinterest scraper error:', error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return NextResponse.json({ 
      error: 'Failed to scrape Pinterest images',
      details: error.message 
    }, { status: 500 });
  }
}
