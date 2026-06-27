import hre from "hardhat";

const { ethers } = await hre.network.create();
const [buyer] = await ethers.getSigners();
const propertyShares = await ethers.deployContract("PropertyShares");

await propertyShares.waitForDeployment();

const propertyAddress = await propertyShares.getAddress();
const pricePerShare = ethers.parseEther("0.01");
const purchaseAmount = 2n;
const purchaseValue = pricePerShare * purchaseAmount;

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

assertEqual(await propertyShares.propertyName(), "RoyalCity Tower", "propertyName");
assertEqual(await propertyShares.totalShares(), 100n, "totalShares");
assertEqual(await propertyShares.pricePerShare(), pricePerShare, "pricePerShare");
assertEqual(await propertyShares.sharesSold(), 0n, "initial sharesSold");

const purchaseTx = await propertyShares.buyShares(purchaseAmount, {
  value: purchaseValue,
});
const purchaseReceipt = await purchaseTx.wait();

if (purchaseReceipt === null) {
  throw new Error("purchase transaction was not mined");
}

const purchaseEvents = await propertyShares.queryFilter(
  propertyShares.filters.SharesPurchased(),
  purchaseReceipt.blockNumber,
  purchaseReceipt.blockNumber,
);
const sawPurchaseEvent = purchaseEvents.some(
  (event) =>
    event.args.buyer === buyer.address && event.args.amount === purchaseAmount,
);

if (!sawPurchaseEvent) {
  throw new Error("SharesPurchased event not found");
}

assertEqual(await propertyShares.sharesSold(), purchaseAmount, "sharesSold");
assertEqual(
  await propertyShares.sharesOwned(buyer.address),
  purchaseAmount,
  "sharesOwned",
);

console.log("Demo validation passed");
console.log(`Contract: ${propertyAddress}`);
console.log(`Buyer: ${buyer.address}`);
console.log(`Purchased: ${purchaseAmount} shares`);
console.log(`Paid: ${ethers.formatEther(purchaseValue)} ETH`);
