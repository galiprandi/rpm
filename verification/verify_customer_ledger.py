import time
from playwright.sync_api import sync_playwright

def test_verify_ledger():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1600}) # Larger height to see everything!
        page = context.new_page()

        customer_id = "4a5ba3c2-1a15-4044-9d1b-6c3458ab27a0"
        print(f"Navigating directly to Juan Perez detail page ({customer_id})...")
        page.goto(f"http://localhost:3002/adm/customers/{customer_id}")

        print("Waiting for customer detail page to load...")
        page.wait_for_timeout(8000)

        # Scroll to the bottom to make sure everything is fully rendered
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

        # Screenshot of customer detail page with transactions list
        page.screenshot(path="./verification/customer_detail_loaded.png")
        print("Customer detail loaded screenshot saved.")

        # Click Imprimir Historial to trigger print layout
        print("Clicking Imprimir Historial button...")
        print_hist_btn = page.get_by_text("Imprimir Historial").first
        print_hist_btn.scroll_into_view_if_needed()
        print_hist_btn.click()
        page.wait_for_timeout(2000)

        # Let's temporarily make print-section visible to screenshot its layout!
        page.evaluate("document.getElementById('print-section').style.display = 'block'")
        page.wait_for_timeout(2000)

        print_section = page.locator("#print-section")
        print_section.screenshot(path="./verification/print_ledger_view.png")
        print("Printed ledger screenshot saved successfully!")

        browser.close()

if __name__ == "__main__":
    test_verify_ledger()
