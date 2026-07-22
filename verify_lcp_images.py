from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        # Log console messages
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: [{msg.type}] {msg.text}"))
        # Log page errors
        page.on("pageerror", lambda err: print(f"BROWSER EXCEPTION: {err}"))

        print("Navigating to /nosotros...")
        page.goto("http://localhost:3000/nosotros")
        page.wait_for_timeout(3000) # Wait for page rendering

        # Scroll to the milestone section
        print("Scrolling to the milestone section...")
        page.evaluate("window.scrollTo(0, 1000);")
        page.wait_for_timeout(2000)

        page.screenshot(path="nosotros_milestones.png")
        print("Captured /nosotros milestones screenshot.")

        browser.close()

if __name__ == "__main__":
    run()
