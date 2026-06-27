# Sprint Notes

## Scope

Implement:

- Test 1: MetaMask wallet integration demo.
- Test 2: scoped real estate fractional share purchase contract.

## Deliverables

- `ui/index.html`
- `ui/src/main.js`
- `ui/src/styles.css`
- `scripts/validate-ui.mjs`
- `demo/wallet.mjs`
- `demo/wallet.test.mjs`
- `demo/property-shares-client.mjs`
- `demo/property-shares-client.test.mjs`
- Root validation scripts in `package.json`
- `contracts/contracts/PropertyShares.sol`
- Hardhat compile/test/deploy setup under `contracts/`
- Focused tests for success and validation failures
- Minimal deploy script
- Reviewer/demo documentation

## Acceptance Checks

- MetaMask is detected through `window.ethereum`.
- Missing MetaMask shows an install state.
- Wallet connect uses `eth_requestAccounts`.
- Connected wallet address is shortened in the UI.
- Current chain/network ID is displayed.
- `accountsChanged` and `chainChanged` update state.
- Reset clears local connected wallet state.
- Provider event listeners are removed on disposal.
- Browser purchase flow switches/adds Localhost 8545 before signing.
- Browser purchase flow sends `eth_sendTransaction` with exact ETH and `buyShares` calldata.
- Browser purchase flow displays transaction hash and contract balance escrow proof.
- Buyers can purchase shares with exact ETH.
- Zero-share purchases revert.
- Purchases above remaining supply revert.
- Incorrect ETH payment reverts.
- `sharesSold` and `sharesOwned` update after validation.
- `SharesPurchased` is emitted on success.

## Out of Scope

- ERC20/share tokenization
- Secondary market
- KYC/AML flow
- Admin panel
- Frontend contract integration beyond the single tested purchase flow
- Owner withdrawal

## Verification Log

- Passed: `pnpm run lint`
- Passed: `pnpm run wallet:test`
- Passed: `pnpm run contracts:demo`
- Passed: `pnpm run typecheck`
- Passed: `pnpm run test`
- Passed: `pnpm run ui:validate`
- Passed: `pnpm run validate`
- Passed: browser transaction validation on `PORT=5174 pnpm run ui:dev` at `/ui/`
- Browser check target: static server from `pnpm run ui:dev`, path `/ui/`
