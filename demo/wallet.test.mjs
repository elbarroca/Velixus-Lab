import assert from "node:assert/strict";
import test from "node:test";

import { createWalletController, shortenAddress } from "./wallet.mjs";

class FakeProvider {
  constructor({ accounts = [], chainId = "0x1", reject = false } = {}) {
    this.accounts = accounts;
    this.chainId = chainId;
    this.reject = reject;
    this.requests = [];
    this.listeners = new Map();
  }

  async request({ method }) {
    this.requests.push(method);

    if (method === "eth_requestAccounts") {
      if (this.reject) {
        throw new Error("User rejected request");
      }

      return this.accounts;
    }

    if (method === "eth_chainId") {
      return this.chainId;
    }

    throw new Error(`Unsupported method: ${method}`);
  }

  on(eventName, listener) {
    const listeners = this.listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
  }

  removeListener(eventName, listener) {
    this.listeners.get(eventName)?.delete(listener);
  }

  emit(eventName, payload) {
    for (const listener of this.listeners.get(eventName) ?? []) {
      listener(payload);
    }
  }

  listenerCount(eventName) {
    return this.listeners.get(eventName)?.size ?? 0;
  }
}

test("shortens valid wallet addresses for display", () => {
  assert.equal(
    shortenAddress("0x1234567890abcdef1234567890abcdef12345678"),
    "0x1234...5678",
  );
});

test("reports missing MetaMask when no provider exists", () => {
  const wallet = createWalletController(null);

  assert.equal(wallet.getState().status, "missing");
});

test("connects through eth_requestAccounts and records chain id", async () => {
  const provider = new FakeProvider({
    accounts: ["0x1234567890abcdef1234567890abcdef12345678"],
    chainId: "0xaa36a7",
  });
  const wallet = createWalletController(provider);

  await wallet.connect();

  assert.deepEqual(provider.requests, ["eth_requestAccounts", "eth_chainId"]);
  assert.equal(wallet.getState().status, "connected");
  assert.equal(wallet.getState().address, provider.accounts[0]);
  assert.equal(wallet.getState().shortAddress, "0x1234...5678");
  assert.equal(wallet.getState().chainId, "0xaa36a7");
});

test("handles rejected wallet connection without exposing provider errors", async () => {
  const provider = new FakeProvider({ reject: true });
  const wallet = createWalletController(provider);

  await wallet.connect();

  assert.equal(wallet.getState().status, "ready");
  assert.equal(wallet.getState().error, "Wallet connection was rejected.");
});

test("reacts to account and chain changes", async () => {
  const provider = new FakeProvider({
    accounts: ["0x1234567890abcdef1234567890abcdef12345678"],
  });
  const wallet = createWalletController(provider);

  await wallet.connect();
  provider.emit("accountsChanged", [
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  ]);
  provider.emit("chainChanged", "0x5");

  assert.equal(wallet.getState().address, "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
  assert.equal(wallet.getState().shortAddress, "0xabcd...abcd");
  assert.equal(wallet.getState().chainId, "0x5");

  provider.emit("accountsChanged", []);

  assert.equal(wallet.getState().status, "ready");
  assert.equal(wallet.getState().address, null);
});

test("reset clears connected state and dispose removes provider listeners", async () => {
  const provider = new FakeProvider({
    accounts: ["0x1234567890abcdef1234567890abcdef12345678"],
  });
  const wallet = createWalletController(provider);

  assert.equal(provider.listenerCount("accountsChanged"), 1);
  assert.equal(provider.listenerCount("chainChanged"), 1);

  await wallet.connect();
  wallet.reset();

  assert.equal(wallet.getState().status, "ready");
  assert.equal(wallet.getState().address, null);

  wallet.dispose();

  assert.equal(provider.listenerCount("accountsChanged"), 0);
  assert.equal(provider.listenerCount("chainChanged"), 0);
});
