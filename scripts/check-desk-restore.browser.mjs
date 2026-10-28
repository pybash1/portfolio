import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const url = process.argv[2];
if (!url) throw new Error("Pass the URL of a locally served production build.");

const browser = await chromium.launch({
  executablePath:
    process.env.PORTFOLIO_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});

try {
  for (const delayDeskScript of [true, false]) {
    for (const [mode, width, rotation] of [
      ["desktop", 1440, "9deg"],
      ["tablet", 800, "12deg"],
      ["mobile", 375, "12deg"],
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript((selectedMode) => {
        localStorage.setItem(
          "desk-layout:portfolio",
          JSON.stringify({
            version: 1,
            layouts: {
              [selectedMode]: {
                "work-folder": { x: 0.2, y: 0.1, z: 75, r: 12 },
              },
            },
          }),
        );
      }, mode);

      let releaseDeskScript = () => {};
      if (delayDeskScript) {
        const deskScriptBlocked = new Promise((resolve) => {
          releaseDeskScript = resolve;
        });
        await page.route("**/DeskCanvas.astro_*", async (route) => {
          await deskScriptBlocked;
          await route.continue();
        });
      }

      const navigating = page.goto(url, { waitUntil: "load" });
      const folder = page.locator('[data-movable-id="work-folder"]');
      await folder.waitFor();
      const before = await folder.evaluate((item) => ({
        translate: item.style.translate,
        zIndex: item.style.zIndex,
        rotate: item.style.rotate,
        x: item.getBoundingClientRect().x,
        y: item.getBoundingClientRect().y,
      }));
      releaseDeskScript();
      await navigating;
      const after = await folder.evaluate((item) => ({
        translate: item.style.translate,
        zIndex: item.style.zIndex,
        rotate: item.style.rotate,
        x: item.getBoundingClientRect().x,
        y: item.getBoundingClientRect().y,
      }));

      assert.deepEqual(
        before,
        after,
        `${mode} layout shifted after script load (delayed: ${delayDeskScript})`,
      );
      assert.equal(before.zIndex, "75");
      assert.equal(before.rotate, rotation);
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log("Saved desk layout is stable before and after script load.");
