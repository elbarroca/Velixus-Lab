import hre from "hardhat";

const { ethers } = await hre.network.create();
const propertyShares = await ethers.deployContract("PropertyShares");

await propertyShares.waitForDeployment();

console.log(`PropertyShares deployed to ${await propertyShares.getAddress()}`);
console.log(`Property: ${await propertyShares.propertyName()}`);
console.log(`Total shares: ${await propertyShares.totalShares()}`);
console.log(`Price per share: ${await propertyShares.pricePerShare()} wei`);
