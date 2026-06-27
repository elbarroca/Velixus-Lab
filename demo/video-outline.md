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
4. Show the dashboard: contract summary, purchase panel, validation checklist, wallet panel, and security assumptions.
5. Start a local chain:

```sh
cd contracts
pnpm exec hardhat node
```

6. In another terminal, deploy:

```sh
cd contracts
pnpm run deploy:local
```

7. Connect MetaMask in the UI.
8. If prompted, switch/add Localhost 8545.
9. Click `Sign purchase transaction` and confirm in MetaMask.
10. Show transaction hash and escrow balance proof.
11. Show `contracts/contracts/PropertyShares.sol`.
12. Point out constructor values: `RoyalCity Tower`, `100`, `0.01 ether`.
13. Show `buyShares(uint256)` validations before mutation.
14. Show `sharesSold`, `sharesOwned`, and `SharesPurchased`.
15. Explain security scope: exact ETH, Solidity overflow checks, no secrets, no withdrawal/admin paths because they are outside the assessment.
