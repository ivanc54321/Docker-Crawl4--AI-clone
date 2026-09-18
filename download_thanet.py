from pathlib import Path
from urllib.parse import urljoin, urlparse
import json
import re
import time

from playwright.sync_api import sync_playwright


BASE_URL = "https://www.kenthomechoice.org.uk"
OUTPUT_DIR = Path("thanet_listings")
DELAY_SECONDS = 2


def safe_filename(value: str) -> str:
    value = re.sub(r"[^\w\s.-]", "", value, flags=re.UNICODE)
    return re.sub(r"\s+", "_", value.strip())[:100] or "listing"


def unique(values):
    seen = set()
    result = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    print("Opening Kent HomeChoice...")
    page.goto(f"{BASE_URL}/properties", wait_until="networkidle")

    # The Thanet checkbox has the council's official area code.
    thanet_checkbox = page.locator("input[type=checkbox][value='E07000114']")
    if thanet_checkbox.count() == 0:
        raise RuntimeError("Could not find the Thanet filter on the properties page.")

    if not thanet_checkbox.is_checked():
        thanet_checkbox.check()

    page.get_by_role("button", name="Show properties").click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    listing_links = page.locator("a[href*='/properties/']").evaluate_all(
        """links => links.map(link => link.href)
            .filter(href => Number.isInteger(Number(href.split("/").pop())))"""
    )
    listing_links = unique(listing_links)

    print(f"Found {len(listing_links)} Thanet listings.")
    OUTPUT_DIR.mkdir(exist_ok=True)

    for index, listing_url in enumerate(listing_links, start=1):
        print(f"[{index}/{len(listing_links)}] {listing_url}")
        page.goto(listing_url, wait_until="networkidle")

        image_urls = page.locator("img").evaluate_all(
            """images => images.flatMap(image => [
                image.currentSrc,
                image.src,
                image.dataset.src,
                image.dataset.lazySrc
            ]).filter(Boolean)"""
        )
        image_urls = unique(
            urljoin(page.url, image_url)
            for image_url in image_urls
            if image_url.startswith(("http://", "https://", "/"))
        )

        listing_id = listing_url.rstrip("/").split("/")[-1]
        listing_dir = OUTPUT_DIR / safe_filename(f"listing_{listing_id}")
        image_dir = listing_dir / "images"
        image_dir.mkdir(parents=True, exist_ok=True)

        metadata = {
            "url": listing_url,
            "title": page.title(),
            "text": page.locator("body").inner_text(),
            "images": image_urls,
        }
        (listing_dir / "listing.json").write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        for image_number, image_url in enumerate(image_urls, start=1):
            try:
                response = context.request.get(image_url, timeout=30_000)
                if not response.ok:
                    print(f"  Skipping image: HTTP {response.status}")
                    continue

                extension = Path(urlparse(image_url).path).suffix.lower()
                if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
                    extension = ".jpg"

                (image_dir / f"image_{image_number:02d}{extension}").write_bytes(
                    response.body()
                )
            except Exception as error:
                print(f"  Could not download image: {error}")

        time.sleep(DELAY_SECONDS)

    browser.close()

print(f"Finished. Files saved in: {OUTPUT_DIR.resolve()}")
