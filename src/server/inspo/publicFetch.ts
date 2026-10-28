import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { normalizeItemUrl } from "../../lib/inspoEditor";
import { EditorError } from "./http";

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(network, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [network, prefix] of [
  ["2001::", 32],
  ["2001:db8::", 32],
  ["2002::", 16],
] as const)
  blocked.addSubnet(network, prefix, "ipv6");

function publicAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4
    ? !blocked.check(address, "ipv4")
    : family === 6 &&
        globalV6.check(address, "ipv6") &&
        !blocked.check(address, "ipv6");
}

export async function publicTarget(
  value: string,
): Promise<{ url: URL; address: string; family: number }> {
  let url: URL;
  try {
    url = normalizeItemUrl(value);
  } catch {
    throw new EditorError("Enter a public website URL.");
  }
  if (url.port && url.port !== "443" && url.port !== "80")
    throw new EditorError("Use a public HTTP or HTTPS URL.");
  if (
    isIP(url.hostname.replace(/^\[|\]$/g, "")) ||
    /\.(localhost|local|internal|test|invalid)$/i.test(url.hostname)
  )
    throw new EditorError("Only public websites can be previewed.");
  let addresses;
  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch {
    throw new EditorError(
      "This website couldn’t be reached. Check the URL.",
      422,
    );
  }
  if (
    !addresses.length ||
    addresses.some(({ address }) => !publicAddress(address))
  )
    throw new EditorError("Only public websites can be previewed.");
  const first = addresses[0]!;
  return { url, address: first.address, family: first.family };
}

/** DNS is pinned to the checked address, including for redirected resources. */
async function fetchPublic(
  value: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    limit?: number;
  } = {},
) {
  const { url, address, family } = await publicTarget(value);
  return new Promise<{
    status: number;
    headers: Record<string, string>;
    body: Buffer;
  }>((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    const headers = {
      "user-agent": "Mozilla/5.0 (compatible; InspoPreview/1.0)",
      ...options.headers,
      "accept-encoding": "identity",
      host: url.host,
    };
    // Content length is recalculated after encoding; browser transfer headers do not apply.
    for (const key of [
      "connection",
      "content-length",
      "transfer-encoding",
      "accept-encoding",
    ])
      delete (headers as Record<string, string>)[key];
    const req = send(
      url,
      {
        method: options.method ?? "GET",
        headers,
        family,
        lookup: (_host, _options, callback) => callback(null, address, family),
        timeout: 12_000,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > (options.limit ?? 12_000_000))
            req.destroy(
              new EditorError("This page is too large to preview.", 422),
            );
          else chunks.push(chunk);
        });
        response.on("end", () => {
          const resultHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.headers))
            if (value)
              resultHeaders[key] = Array.isArray(value)
                ? value.join(", ")
                : value;
          resolve({
            status: response.statusCode ?? 502,
            headers: resultHeaders,
            body: Buffer.concat(chunks),
          });
        });
        response.on("error", reject);
      },
    );
    req.on("timeout", () =>
      req.destroy(
        new EditorError("This website took too long to respond.", 422),
      ),
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

export async function fetchPublicPage(value: string, limit = 2_000_000) {
  let url = value;
  for (let count = 0; count < 6; count++) {
    const response = await fetchPublic(url, { limit });
    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.location
    ) {
      url = new URL(response.headers.location, url).href;
      continue;
    }
    if (response.status >= 400)
      throw new EditorError(
        "This website couldn’t be reached. Check the URL.",
        422,
      );
    return { ...response, url };
  }
  throw new EditorError("This website redirects too many times.", 422);
}
