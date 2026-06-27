# Demo Video Outline

1. Run the full validation:

```sh
pnpm run validate
```

2. Start the UI:

```sh
pnpm run ui:dev
```

3. Open `http://127.0.0.1:5173/ui/`.
4. Show the dashboard: contract summary, purchase simulator, validation checklist, wallet panel, and security assumptions.
5. Show `contracts/contracts/PropertyShares.sol`.
6. Point out constructor values: `RoyalCity Tower`, `100`, `0.01 ether`.
7. Show `buyShares(uint256)` validations before mutation.
8. Show `sharesSold`, `sharesOwned`, and `SharesPurchased`.
9. Optional persistent local deploy:

```sh
cd contracts
pnpm exec hardhat node
```

10. In another terminal:

```sh
cd contracts
pnpm run deploy:local
```

11. Explain security scope: exact ETH, Solidity overflow checks, no secrets, no withdrawal/admin paths because they are outside the assessment.
