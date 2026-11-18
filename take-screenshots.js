import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function takeScreenshots() {
  console.log('🚀 Starting automated screenshot capture...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina quality
  });
  
  const page = await context.newPage();
  const screenshotsDir = path.join(__dirname, 'screenshots');
  
  try {
    // Navigate to landing page
    console.log('📍 Navigating to landing page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for animations
    
    // 1. Hero section with terminal
    console.log('📸 Capturing hero section...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'landing', '01-hero.png'),
      fullPage: false,
    });
    
    // 2. Scroll to concepts section
    console.log('📸 Capturing concepts section...');
    await page.evaluate(() => {
      document.querySelector('.concepts-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    const conceptsSection = await page.locator('.concepts-section');
    await conceptsSection.screenshot({
      path: path.join(screenshotsDir, 'landing', '02-concepts.png'),
    });
    
    // 3. Before/After comparison
    console.log('📸 Capturing comparison section...');
    await page.evaluate(() => {
      document.querySelector('.difference-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    const comparisonSection = await page.locator('.difference-section');
    await comparisonSection.screenshot({
      path: path.join(screenshotsDir, 'landing', '03-comparison.png'),
    });
    
    // 4. Timeline
    console.log('📸 Capturing timeline...');
    await page.evaluate(() => {
      document.querySelector('.week-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    const timelineSection = await page.locator('.week-section');
    await timelineSection.screenshot({
      path: path.join(screenshotsDir, 'landing', '04-timeline.png'),
    });
    
    // 5. Final CTA
    console.log('📸 Capturing final CTA...');
    await page.evaluate(() => {
      document.querySelector('.final-cta')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    const ctaSection = await page.locator('.final-cta');
    await ctaSection.screenshot({
      path: path.join(screenshotsDir, 'landing', '05-cta.png'),
    });
    
    // Click "Start Week 1" to enter app
    console.log('\n🚪 Entering app...');
    await page.click('button:has-text("Start Week 1")');
    await page.waitForTimeout(2000);
    
    // 6. Dashboard
    console.log('📸 Capturing dashboard...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'app', '01-dashboard.png'),
      fullPage: false,
    });
    
    // 7. Click on Day 1
    console.log('📸 Navigating to Day 1...');
    const day1Link = await page.locator('text=Day 1: Rendering Pipeline').first();
    if (await day1Link.count() > 0) {
      await day1Link.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({
        path: path.join(screenshotsDir, 'app', '02-day1-content.png'),
        fullPage: true,
      });
    }
    
    // 8. Try to capture code playground if visible
    console.log('📸 Looking for code playground...');
    const playground = await page.locator('.code-playground, [class*="playground"]').first();
    if (await playground.count() > 0) {
      await playground.screenshot({
        path: path.join(screenshotsDir, 'app', '03-playground.png'),
      });
    }
    
    // 9. Try to capture quiz if visible
    console.log('📸 Looking for quiz...');
    const quiz = await page.locator('.quiz, [class*="quiz"]').first();
    if (await quiz.count() > 0) {
      await quiz.screenshot({
        path: path.join(screenshotsDir, 'app', '04-quiz.png'),
      });
    }
    
    console.log('\n✅ Screenshots captured successfully!');
    console.log(`📂 Saved to: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ Error taking screenshots:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the script
takeScreenshots().catch(console.error);
