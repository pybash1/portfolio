# Portfolio home page performance, 2026-10-28

Measured the production Astro build in fresh headless Chrome contexts at 1440 × 900, served from a local Python static server. The server did not compress responses, so transferred bytes are useful for comparing these builds but do not represent production network transfer. Each result is the median of three runs.

| Metric | Before | After |
| --- | ---: | ---: |
| Total transferred | 10,728,701 B | 3,500,823 B |
| Requests | 33 | 34 |
| HTML | 2,798,568 B | 613,469 B |
| First contentful paint | 180 ms | 176 ms |
| Load event | 90 ms | 95 ms |

Transfer fell by 7,227,878 B (67.4%). The new atlas geography request accounts for the extra request. After the changes, the geography SVG is 559,693 B raw (198,520 B gzipped) and the HTML is 92,982 B gzipped. Local paint timing is effectively unchanged; a slower network would show the benefit of the smaller payload more clearly.

The optimized page passed `bun run build`, a mobile Chrome smoke test at 375 × 812, and visual checks of the atlas and animated pen shadows. The mobile check reported no page errors or failed requests. A loading bar was unnecessary because the page already painted promptly, and adding one would increase startup work.
