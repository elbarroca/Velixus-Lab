# Submit Test Demo

Minimal demo workspace with:

- Test 1 MetaMask wallet integration under `demo/`
- Test 2 Solidity/Hardhat property share contract under `contracts/`

## Architecture

- `ui/` is a static demo app.
- `ui/src/main.js` renders the property demo and MetaMask wallet panel.
- `scripts/validate-ui.mjs` serves and validates the static UI with Node built-ins.
- `demo/wallet.mjs` isolates wallet/provider logic.
- `demo/wallet.test.mjs` covers provider detection, connect, rejection, wallet events, reset, and cleanup.
- `contracts/contracts/PropertyShares.sol` holds the full contract.
- `contracts/test/PropertyShares.js` covers initialization, successful purchase, event emission, zero amount, oversupply, and wrong ETH.
- `contracts/scripts/deploy.js` deploys `PropertyShares` to the selected Hardhat network.

No ERC20 tokenization, secondary market, KYC, withdrawal path, admin panel, or contract-connected frontend is included. The contract intentionally matches the assessment scope only.

## MetaMask Demo Behavior

- Detects MetaMask via `window.ethereum`.
- Shows an install MetaMask state when no provider is present.
- Connects with `eth_requestAccounts`.
- Displays the connected address shortened for UI.
- Displays the current chain ID from `eth_chainId`.
- Reacts to `accountsChanged` and `chainChanged`.
- Provides a reset connection button for local UI state.
- Cleans up provider listeners on page unload.

## Contract Behavior

- Property name: `RoyalCity Tower`
- Total shares: `100`
- Price per share: `0.01 ETH`
- `buyShares(uint256 shareAmount)` is payable.
- Purchases require `shareAmount > 0`, enough remaining shares, and exact ETH payment.
- State is updated only after validation.
- `SharesPurchased(address buyer, uint256 amount)` is emitted on purchase.

## Commands

```sh
cd contracts
pnpm install
cd ..
pnpm run validate
pnpm run ui:dev
```

Open [http://127.0.0.1:5173/ui/](http://127.0.0.1:5173/ui/) after `pnpm run ui:dev` to demo the app. If 5173 is busy, run `PORT=5174 pnpm run ui:dev` and open `/ui/` on that port.

Local deployment:

```sh
cd contracts
pnpm exec hardhat node
```

In another terminal:

```sh
cd contracts
pnpm run deploy:local
```

## Security Assumptions

- Wallet/provider data is treated as external input and normalized before display.
- Rejected MetaMask requests show a generic UI error and do not log provider errors.
- The demo never logs private keys, secrets, or raw provider error objects.
- Solidity `^0.8.28` provides checked arithmetic.
- ETH validation is exact: `msg.value == shareAmount * pricePerShare`.
- The contract does not include owner withdrawals because the assessment did not require custody management.
- The contract has no private keys, secrets, external calls, empty catch blocks, or admin-only paths.
- `sharesSold` and `sharesOwned` are the only mutable purchase state.

## Verification

Run before review:

```sh
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run validate
```

`pnpm run validate` runs contract demo validation, wallet helper tests, JS syntax checks, and served static UI checks. Contract demo validation compiles/tests contracts, deploys to an ephemeral Hardhat network, buys shares, checks state, and checks the purchase event.

`pnpm run deploy:local` remains available for a persistent local node and requires a running `pnpm exec hardhat node`.
