#!/usr/bin/env python3
import asyncio
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

from playwright.async_api import async_playwright

async def capture_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        
        # Navigate to the app
        await page.goto('http://localhost:3847')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(2)
        
        # 1. Overview section (default view)
        print("Capturing overview...")
        await page.screenshot(path='/opt/cursor/artifacts/screenshots/overview.png', full_page=False)
        
        # 2. Lead Sources
        print("Capturing lead sources...")
        await page.click('text=Lead sources')
        await asyncio.sleep(1)
        await page.screenshot(path='/opt/cursor/artifacts/screenshots/lead-sources.png', full_page=False)
        
        # 3. Plans and value
        print("Capturing plans...")
        await page.click('text=Plans and value')
        await asyncio.sleep(1)
        await page.screenshot(path='/opt/cursor/artifacts/screenshots/plans.png', full_page=False)
        
        # 4. Month by month
        print("Capturing month grid...")
        await page.click('text=Month by month')
        await asyncio.sleep(1)
        await page.screenshot(path='/opt/cursor/artifacts/screenshots/month-grid.png', full_page=False)
        
        # 5. Scenarios
        print("Capturing scenarios...")
        await page.click('text=Scenarios')
        await asyncio.sleep(1)
        await page.screenshot(path='/opt/cursor/artifacts/screenshots/scenarios.png', full_page=False)
        
        await browser.close()
        print("All screenshots captured successfully!")

asyncio.run(capture_screenshots())
