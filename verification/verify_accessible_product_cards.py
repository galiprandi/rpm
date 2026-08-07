import time
from playwright.sync_api import sync_playwright

def main():
    print("Starting Playwright accessible cards verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1000})
        page = context.new_page()

        print("Navigating to http://localhost:3001/productos...")
        page.goto("http://localhost:3001/productos")
        time.sleep(5)  # wait for Turbopack compilation and client-side hydration

        # Search for products to see what is loaded
        html = page.content()
        print("Page HTML sample length:", len(html))

        # Focus on the first product card using keyboard Tab
        print("Tab-focusing on the product card...")
        # Since we have the search input, categories, etc., we can tab to the first card,
        # or we can find it by its ARIA role/label and call focus().
        first_card = page.locator("[role='button'][aria-label^='Ver detalles de']")
        if first_card.count() > 0:
            print("Found accessible card locator!")
            # Hover over it to trigger absolute overlay
            first_card.first.hover()
            time.sleep(1)
            # Focus on it to trigger focus outline
            first_card.first.focus()
            time.sleep(1)
            # Take a screenshot showing focused state
            page.screenshot(path="verification/focused_card.png")
            print("Screenshot saved to verification/focused_card.png")

            # Press Enter to open the modal
            print("Pressing Enter to trigger modal...")
            page.keyboard.press("Enter")
            time.sleep(2)

            # Take a screenshot showing the open modal
            page.screenshot(path="verification/modal_opened.png")
            print("Screenshot saved to verification/modal_opened.png")
        else:
            print("No accessible product cards found. Taking fallback screenshot of catalog.")
            page.screenshot(path="verification/catalog_fallback.png")

        browser.close()

if __name__ == "__main__":
    main()
