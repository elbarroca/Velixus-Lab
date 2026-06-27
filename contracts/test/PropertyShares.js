import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();
const TOTAL_SHARES = 100n;
const PRICE_PER_SHARE = ethers.parseEther("0.01");

async function deployPropertyShares() {
  const [buyer] = await ethers.getSigners();
  const propertyShares = await ethers.deployContract("PropertyShares");

  return { buyer, propertyShares };
}

describe("PropertyShares", function () {
  it("initializes the assessment property terms", async function () {
    const { propertyShares } = await deployPropertyShares();

    expect(await propertyShares.propertyName()).to.equal("RoyalCity Tower");
    expect(await propertyShares.totalShares()).to.equal(TOTAL_SHARES);
    expect(await propertyShares.pricePerShare()).to.equal(PRICE_PER_SHARE);
    expect(await propertyShares.sharesSold()).to.equal(0n);
  });

  it("records a purchase and emits SharesPurchased", async function () {
    const { buyer, propertyShares } = await deployPropertyShares();
    const amount = 3n;

    await expect(
      propertyShares.buyShares(amount, { value: PRICE_PER_SHARE * amount }),
    )
      .to.emit(propertyShares, "SharesPurchased")
      .withArgs(buyer.address, amount);

    expect(await propertyShares.sharesSold()).to.equal(amount);
    expect(await propertyShares.sharesOwned(buyer.address)).to.equal(amount);
  });

  it("rejects zero-share purchases", async function () {
    const { propertyShares } = await deployPropertyShares();

    await expect(propertyShares.buyShares(0n)).to.be.revertedWith(
      "share amount must be greater than zero",
    );
  });

  it("rejects purchases above remaining supply", async function () {
    const { propertyShares } = await deployPropertyShares();
    const amount = TOTAL_SHARES + 1n;

    await expect(
      propertyShares.buyShares(amount, { value: PRICE_PER_SHARE * amount }),
    ).to.be.revertedWith("not enough shares remaining");
  });

  it("rejects incorrect ETH payment", async function () {
    const { propertyShares } = await deployPropertyShares();

    await expect(
      propertyShares.buyShares(2n, { value: PRICE_PER_SHARE }),
    ).to.be.revertedWith("incorrect ETH amount");
  });
});
