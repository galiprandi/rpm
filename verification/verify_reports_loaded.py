import time
from playwright.sync_api import sync_playwright

def test_capture_reports():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1200})
        page = context.new_page()

        print("Navigating to reports page...")
        page.goto("http://localhost:3000/adm/reports")

        print("Waiting for page content to load...")
        page.wait_for_timeout(10000)

        screenshot_path = "./verification/reports_overview_loaded.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot successfully captured at {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    test_capture_reports()
