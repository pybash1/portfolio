import assert from "node:assert/strict";
import { decodeHtmlTitle } from "../src/server/inspo/preview.ts";

assert.equal(decodeHtmlTitle("A &amp; B"), "A & B");
assert.equal(decodeHtmlTitle("&amp;lt;script&amp;gt;"), "&lt;script&gt;");
assert.equal(decodeHtmlTitle("Don&#x27;t &#X2014; stop"), "Don't — stop");
assert.equal(decodeHtmlTitle("&#39;quoted&#39;"), "'quoted'");
console.log("HTML titles decode one entity layer, including hex references.");
