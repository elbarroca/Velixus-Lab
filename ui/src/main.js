import {
  createWalletController,
  getEthereum,
} from "../../demo/wallet.mjs";

const TOTAL_SHARES = 100;
const SHARES_SOLD = 2;
const PRICE_PER_SHARE_ETH = 0.01;
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const LOCALHOST_CHAIN_ID = "0x7a69";

const metrics = [
  ["clipboard", "Total shares", String(TOTAL_SHARES), "shares", "blue"],
  ["plug", "Price per share", PRICE_PER_SHARE_ETH.toFixed(2), "ETH", "amber"],
  ["cart", "Shares sold", String(SHARES_SOLD), "shares", "green"],
  ["file", "Shares remaining", String(TOTAL_SHARES - SHARES_SOLD), "shares", "blue"],
];

const validations = [
  ["Compile", "Solidity 0.8.x compilation"],
  ["Tests", "5 Hardhat tests passed"],
  ["Demo validation", "State and event verified"],
  ["Local deploy", "Contract deploy script verified"],
];

const assumptions = [
  ["shield", "Exact ETH only", "Contract accepts exact ETH amounts only."],
  ["code", "Solidity 0.8 checks", "Built-in overflow and underflow checks."],
  ["lock", "No withdrawal / admin", "No fund withdrawal or admin functions."],
];

const walletController = createWalletController(getEthereum());
let shares = 2;

function icon(name, size = 24) {
  const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const paths = {
    building:
      '<path d="M3 21h18"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M9 8h1"/><path d="M14 8h1"/><path d="M9 12h1"/><path d="M14 12h1"/><path d="M9 16h1"/><path d="M14 16h1"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l3.6 12.6a2 2 0 0 0 2 1.4h6.8a2 2 0 0 0 2-1.5L22 7H6"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    circleCheck: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>',
    clipboard:
      '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    minus: '<path d="M5 12h14"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="m9 12 2 2 4-4"/>',
    wallet:
      '<path d="M19 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a2 2 0 0 1 2 2v1"/><path d="M3 6v12a3 3 0 0 0 3 3h13a2 2 0 0 0 2-2v-3"/><path d="M18 12h4v4h-4a2 2 0 0 1 0-4"/>',
  };

  return `<svg ${common}>${paths[name] ?? paths.file}</svg>`;
}

function metricMarkup([iconName, label, value, unit, tone]) {
  return `
    <div class="metric">
      <div class="metric-icon ${tone}">${icon(iconName, 26)}</div>
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${unit}</small>
    </div>`;
}

function panel(title, iconName, body) {
  return `
    <article class="panel">
      <div class="panel-title">
        ${icon(iconName, 26)}
        <h2>${title}</h2>
      </div>
      ${body}
    </article>`;
}

function render(wallet) {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  const remainingShares = TOTAL_SHARES - SHARES_SOLD;
  const totalCost = (shares * PRICE_PER_SHARE_ETH).toFixed(2);
  const isValidPurchase = shares > 0 && shares <= remainingShares;
  const isWalletMissing = wallet.status === "missing";
  const isWalletConnecting = wallet.status === "connecting";
  const walletStatusLabel = {
    connected: "Wallet connected",
    connecting: "Connecting wallet",
    missing: "MetaMask not installed",
    ready: "Wallet ready",
  }[wallet.status];
  const walletAddressLabel = isWalletMissing
    ? "Install MetaMask"
    : wallet.shortAddress ?? "MetaMask not connected";
  const walletNetworkLabel = isWalletMissing
    ? "MetaMask is required to connect a wallet."
    : wallet.chainId === LOCALHOST_CHAIN_ID
      ? "Local Hardhat network"
      : wallet.chainId ?? "Connect for chain id";
  const walletActions = isWalletMissing
    ? '<a href="https://metamask.io/download/" rel="noreferrer" target="_blank">Install MetaMask</a>'
    : `<button data-action="connect" ${isWalletConnecting ? "disabled" : ""} type="button">${
        isWalletConnecting ? "Connecting" : "Connect wallet"
      }</button>${
        wallet.status === "connected"
          ? '<button data-action="reset" type="button">Reset wallet</button>'
          : ""
      }`;

  root.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">${icon("building", 34)}<span>RoyalCity Tower</span></div>
        <div class="status"><span class="status-dot"></span>Demo ready</div>
        <div class="network">Localhost 8545</div>
      </header>

      <section class="grid">
        ${panel(
          "Contract summary",
          "file",
          `
            <div class="metrics">${metrics.map(metricMarkup).join("")}</div>
            <div class="contract-address">
              ${icon("code", 22)}
              <div><span>Contract address</span><code>${CONTRACT_ADDRESS}</code></div>
              ${icon("copy", 20)}
            </div>
          `,
        )}

        ${panel(
          "Purchase simulator",
          "cart",
          `
            <label class="field-label" for="share-count">Number of shares to purchase</label>
            <div class="stepper">
              <button aria-label="Decrease shares" data-action="decrease" type="button">${icon("minus", 20)}</button>
              <input id="share-count" min="1" max="${remainingShares}" type="number" value="${shares}" />
              <button aria-label="Increase shares" data-action="increase" type="button">${icon("plus", 20)}</button>
            </div>
            <div class="range-row"><span>Min 1 - Max ${remainingShares}</span><strong>Available: ${remainingShares}</strong></div>
            <div class="price-row"><span>Price per share</span><strong>${PRICE_PER_SHARE_ETH.toFixed(2)} ETH</strong></div>
            <div class="total-row"><span>Total cost</span><strong>${totalCost} ETH</strong></div>
            <div class="${isValidPurchase ? "success-callout" : "error-callout"}">
              ${icon("check", 22)}
              <div>
                <strong>${isValidPurchase ? "Validation successful" : "Invalid purchase"}</strong>
                <span>${isValidPurchase ? "Purchase simulation is valid and ready to demonstrate." : "Share amount must stay inside the remaining supply."}</span>
              </div>
            </div>
            <button class="primary-action" type="button">${icon("shield", 22)}Validate purchase</button>
          `,
        )}

        ${panel(
          "Validation checklist",
          "shield",
          `
            <div class="validation-list">
              ${validations
                .map(
                  ([title, description]) => `
                    <div class="validation-item">
                      ${icon("circleCheck", 34)}
                      <div><strong>${title}</strong><span>${description}</span></div>
                      <em>Passed</em>
                    </div>`,
                )
                .join("")}
            </div>
            <div class="all-passed">
              ${icon("check", 24)}
              <div><strong>All validations passed</strong><span>Demo is ready to use.</span></div>
            </div>
          `,
        )}
      </section>

      <section class="lower-band">
        <div class="wallet-panel">
          <div class="avatar">${icon("wallet", 34)}</div>
          <div>
            <span class="wallet-state">${walletStatusLabel}</span>
            <strong>${walletAddressLabel}</strong>
            <small>${walletNetworkLabel}</small>
            ${wallet.error ? `<p role="alert">${wallet.error}</p>` : ""}
          </div>
          <div class="wallet-actions">${walletActions}</div>
        </div>

        <div class="assumptions">
          <div class="section-heading">${icon("shield", 32)}<h2>Security assumptions</h2></div>
          <div class="assumption-grid">
            ${assumptions
              .map(
                ([iconName, title, description]) => `
                  <article>
                    ${icon(iconName, 34)}
                    <div><strong>${title}</strong><span>${description}</span></div>
                  </article>`,
              )
              .join("")}
          </div>
        </div>
      </section>
    </main>`;

  bindEvents();
}

function updateShares(nextShares) {
  const remainingShares = TOTAL_SHARES - SHARES_SOLD;
  shares = Math.min(remainingShares, Math.max(1, nextShares));
  render(walletController.getState());
}

function bindEvents() {
  const input = document.getElementById("share-count");
  input?.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement) {
      updateShares(Number(event.target.value));
    }
  });

  document.querySelector('[data-action="decrease"]')?.addEventListener("click", () => {
    updateShares(shares - 1);
  });

  document.querySelector('[data-action="increase"]')?.addEventListener("click", () => {
    updateShares(shares + 1);
  });

  document.querySelector('[data-action="connect"]')?.addEventListener("click", () => {
    void walletController.connect();
  });

  document.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
    walletController.reset();
  });
}

walletController.subscribe(render);

window.addEventListener(
  "pagehide",
  () => {
    walletController.dispose();
  },
  { once: true },
);
