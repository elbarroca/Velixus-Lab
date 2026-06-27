import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PROPERTY_SHARES_ADDRESS,
  HARDHAT_CHAIN_ID,
  buyPropertyShares,
  encodeBuyShares,
  purchaseValueWei,
  switchToLocalHardhat,
} from "./property-shares-client.mjs";

class FakeProvider {
  constructor({ chainId = HARDHAT_CHAIN_ID, receiptAfter = 1, switchMissing = false } = {}) {
    this.chainId = chainId;
    this.receiptAfter = receiptAfter;
    this.switchMissing = switchMissing;
    this.receiptRequests = 0;
    this.requests = [];
  }

  async request(payload) {
    this.requests.push(payload);

    if (payload.method === "eth_chainId") {
      return this.chainId;
    }

    if (payload.method === "wallet_switchEthereumChain") {
      if (this.switchMissing) {
        const error = new Error("Unknown chain");
        error.code = 4902;
        throw error;
      }

      this.chainId = payload.params[0].chainId;
      return null;
    }

    if (payload.method === "wallet_addEthereumChain") {
      this.chainId = payload.params[0].chainId;
      return null;
    }

    if (payload.method === "eth_sendTransaction") {
      return "0xabc123";
    }

    if (payload.method === "eth_getTransactionReceipt") {
      this.receiptRequests += 1;
      return this.receiptRequests >= this.receiptAfter
        ? { status: "0x1", transactionHash: "0xabc123" }
        : null;
    }

    if (payload.method === "eth_getBalance") {
      return "0x470de4df820000";
    }

    throw new Error(`Unsupported method: ${payload.method}`);
  }
}

test("encodes buyShares(uint256) calldata and exact wei", () => {
  assert.equal(
    encodeBuyShares(2),
    "0xd1a93d18" + "0".repeat(63) + "2",
  );
  assert.equal(purchaseValueWei(2), 20_000_000_000_000_000n);
});

test("sends a buyShares transaction and returns escrow proof", async () => {
  const provider = new FakeProvider({ receiptAfter: 2 });

  const result = await buyPropertyShares(provider, {
    from: "0x1234567890abcdef1234567890abcdef12345678",
    shareAmount: 2,
    pollIntervalMs: 0,
  });

  assert.equal(result.transactionHash, "0xabc123");
  assert.equal(result.escrowBalanceWei, 20_000_000_000_000_000n);
  assert.deepEqual(provider.requests[1], {
    method: "eth_sendTransaction",
    params: [
      {
        from: "0x1234567890abcdef1234567890abcdef12345678",
        to: DEFAULT_PROPERTY_SHARES_ADDRESS,
        value: "0x470de4df820000",
        data: encodeBuyShares(2),
      },
    ],
  });
});

test("blocks purchases when wallet is not on local Hardhat", async () => {
  const provider = new FakeProvider({ chainId: "0x1" });

  await assert.rejects(
    buyPropertyShares(provider, {
      from: "0x1234567890abcdef1234567890abcdef12345678",
      shareAmount: 2,
      pollIntervalMs: 0,
    }),
    /Switch MetaMask to Localhost 8545/,
  );
});

test("switches to local Hardhat and adds the chain when MetaMask does not know it", async () => {
  const provider = new FakeProvider({ chainId: "0x1", switchMissing: true });

  await switchToLocalHardhat(provider);

  assert.equal(provider.chainId, HARDHAT_CHAIN_ID);
  assert.deepEqual(
    provider.requests.map((request) => request.method),
    ["wallet_switchEthereumChain", "wallet_addEthereumChain"],
  );
});
