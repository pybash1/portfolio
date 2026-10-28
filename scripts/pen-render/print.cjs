// The print on the pen's upper barrel (the ADD Gel label), unrolled: x along the pen (mm 74–126,
// 50 px/mm) by the full circumference (arc mm from the side facing up, toward
// the bottom of the screen going down the image). Transparent where bare chrome.
const fs = require("fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE ?? "playwright-core");

const radius = 4.32,
  from = 74,
  to = 126,
  W = 2600,
  H = 1200;

(async () => {
  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage();

  const url = await page.evaluate(
    ({ radius, from, to, W, H }) => {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const g = canvas.getContext("2d");

      const around = 2 * Math.PI * radius,
        sx = W / (to - from),
        sy = H / around;

      g.setTransform(sx, 0, 0, sy, -from * sx, H / 2);

      // The label: a black panel with the ADD Gel mark.
      const round = (x, y, w, h, r) => {
        g.beginPath();
        g.roundRect(x, y, w, h, r);
        g.fill();
      };

      g.fillStyle = "#0b0b0d";
      round(93, -1.72, 21.6, 3.44, 0.5);
      g.fillStyle = "#d8352c";
      g.beginPath();
      g.moveTo(94.0, 0.95);
      g.lineTo(95.0, -0.95);
      g.lineTo(95.9, -0.95);
      g.lineTo(94.9, 0.95);
      g.fill();
      g.fillStyle = "#f4f4f2";
      g.font = "800 italic 2.4px Helvetica Neue, Arial, sans-serif";
      g.textBaseline = "alphabetic";
      g.fillText("ADD", 96.3, 0.85);
      g.fillStyle = "#e2453b";
      g.font = "italic 2.05px Snell Roundhand, Brush Script MT, cursive";
      g.fillText("Gel", 103.1, 0.62);
      g.fillStyle = "#ececea";
      g.font = "bold .95px Helvetica Neue, Arial, sans-serif";
      g.fillText("DESIGNER", 108.6, -0.12);
      g.fillText("SERIES", 109.45, 1.08);
      return canvas.toDataURL("image/png");
    },
    { radius, from, to, W, H },
  );

  fs.writeFileSync(
    __dirname + "/print.png",
    Buffer.from(url.split(",")[1], "base64"),
  );

  await browser.close();
  console.log("print.png written");
})();
