import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    print("Navigating to /productos...")
    page.goto("http://localhost:3000/productos")
    page.wait_for_timeout(3000)

    # 1. Take a screenshot of the main state (Category 'Todos')
    print("Capturing Todos state...")
    page.screenshot(path="./verification/todos_state.png")
    page.wait_for_timeout(1000)

    # 2. Click on the category button 'Prueba' to verify category filtering
    print("Filtering by 'Prueba' category...")
    page.get_by_role("button", name="Prueba", exact=True).click()
    page.wait_for_timeout(1500)

    # Take a screenshot of the filtered state
    page.screenshot(path="./verification/prueba_state.png")
    page.wait_for_timeout(1000)

    # 3. Click back to 'Todos' to restore full product list before search
    print("Clicking back to 'Todos'...")
    page.get_by_role("button", name="Todos", exact=True).click()
    page.wait_for_timeout(1000)

    # 4. Search for 'Inexistente' to trigger empty state
    print("Searching for non-existent product...")
    search_input = page.get_by_placeholder("Buscar producto...")
    search_input.click()
    search_input.press_sequentially("Inexistente", delay=100)
    page.wait_for_timeout(2000)

    # Take a screenshot of empty state suggestions
    page.screenshot(path="./verification/empty_state.png")
    page.wait_for_timeout(1000)

    # 5. Click the '💡 Bi-LED' suggestion chip
    print("Clicking suggestion chip '💡 Bi-LED'...")
    chip = page.get_by_role("button", name="💡 Bi-LED")
    chip.scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    chip.click()
    page.wait_for_timeout(2000)

    # Take final screenshot showing matching products
    page.screenshot(path="./verification/final_state.png")
    page.wait_for_timeout(1000)

    print("Verification completed successfully!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 2000},
            record_video_dir="./verification"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
