# Portfolio home performance — 2026-11-11

Local Astro dev server, Chrome headless, desktop 1440×900 and mobile 390×844. Each navigation used a fresh browser context with an existing visitor cookie. These are dev measurements, so Vite modules and uncompressed local transfers are included; they are not production Web Vitals.

| View | State | TTFB | FCP | Load | Transfer | Requests |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | Before, cold DB | 3938 ms | 4060 ms | 5196 ms | 4.31 MB | 54 |
| Desktop | After, cold DB | 3090 ms | 3212 ms | 4079 ms | 3.20 MB | 52 |
| Mobile | Before, warm DB | 477 ms | 548 ms | 1101 ms | 3.98 MB | 52 |
| Mobile | After, warm DB | 481 ms | 548 ms | 1123 ms | 3.12 MB | 51 |

Cold database timing varies, so compare load after TTFB: desktop improved from 1258 ms to 989 ms. Five WebP images shrank from 1,306,816 to 332,944 bytes. The generated geography SVG shrank from 198,520 to 141,396 gzip bytes. The map reverse image is now fetched only when the visitor approaches or flips it.

The database pool now keeps idle connections for 60 seconds. On the restarted dev server, TTFB was 4027 ms on a cold connection, 488 ms on an immediate repeat, and 485 ms after a 15-second pause. At this intermediate stage, a first cold visit still waited for the remote database because the exact visitor count was rendered into the initial HTML.

After switching the ticket to CountAPI, the home route became static and the counter moved after the load event. Two further desktop dev navigations reached first byte in 86 ms and 8 ms; FCP was 228 ms and 80 ms respectively. The CountAPI request did not delay the page load event. The numeric fallback appears in the initial HTML, then the count updates in the browser.

`bun run build` passed with zero errors and two existing hints. Chrome checks confirmed the ticket number in the initial page, map flip and saved reverse side after reload, and no page errors.
