import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const repoRoot = resolve(".");
const uiRoot = resolve("ui");
const requiredHtml = [
  "<div id=\"root\"></div>",
  "/ui/src/styles.css",
  "./src/main.js",
];
const requiredJs = [
  "RoyalCity Tower",
  "Demo ready",
  "All validations passed",
  "Security assumptions",
  "createWalletController",
  "buyPropertyShares",
  "Sign purchase transaction",
  "Escrow balance",
  "Install MetaMask",
  "Reset wallet",
  "wallet-band",
  "validation-strip",
  "validation-pill",
  "pagehide",
];
const requiredCss = [".app-shell", ".grid", ".panel", "@media"];

const mimeTypes = new Map([
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".css", "text/css"],
]);

function assertIncludes(source, expectedValues, label) {
  for (const expected of expectedValues) {
    assert.ok(source.includes(expected), `${label} missing ${expected}`);
  }
}

function assertOrder(source, before, after, label) {
  assert.ok(
    source.indexOf(before) !== -1 && source.indexOf(before) < source.indexOf(after),
    `${label}: expected ${before} before ${after}`,
  );
}

async function readUiFile(path) {
  return readFile(join(uiRoot, path), "utf8");
}

async function fetchText(url) {
  const response = await fetch(url);
  assert.equal(response.status, 200, `${url} returned ${response.status}`);
  return response.text();
}

const html = await readUiFile("index.html");
const js = await readUiFile("src/main.js");
const css = await readUiFile("src/styles.css");

assertIncludes(html, requiredHtml, "HTML");
assertIncludes(js, requiredJs, "JS");
assertIncludes(css, requiredCss, "CSS");
assertOrder(js, "wallet-band", "Contract summary", "wallet placement");
assertOrder(js, "Purchase simulator", "validation-strip", "validation placement");
assert.ok(!js.includes("Validation checklist"), "validation checklist should be compact");

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  const path =
    requestUrl.pathname === "/" || requestUrl.pathname.endsWith("/")
      ? `${requestUrl.pathname}index.html`
      : requestUrl.pathname;
  const filePath = join(repoRoot, path);
  const body = await readFile(filePath);

  response.writeHead(200, {
    "content-type": mimeTypes.get(extname(filePath)) ?? "text/plain",
  });
  response.end(body);
});

await new Promise((resolveListen) => {
  server.listen(0, "127.0.0.1", resolveListen);
});

try {
  const address = server.address();
  assert.ok(address && typeof address === "object", "server address missing");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  assertIncludes(await fetchText(`${baseUrl}/ui/`), requiredHtml, "served HTML");
  assertIncludes(await fetchText(`${baseUrl}/ui/src/main.js`), requiredJs, "served JS");
  assertIncludes(
    await fetchText(`${baseUrl}/demo/wallet.mjs`),
    ["createWalletController", "eth_requestAccounts"],
    "served wallet helper",
  );
  assertIncludes(
    await fetchText(`${baseUrl}/demo/property-shares-client.mjs`),
    ["buyPropertyShares", "eth_sendTransaction", "wallet_switchEthereumChain"],
    "served contract client",
  );
  assertIncludes(await fetchText(`${baseUrl}/ui/src/styles.css`), requiredCss, "served CSS");

  console.log("UI validation passed");
  console.log(baseUrl);
} finally {
  server.close();
}
