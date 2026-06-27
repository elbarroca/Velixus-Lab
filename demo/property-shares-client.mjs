const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const TRANSACTION_HASH_PATTERN = /^0x[a-fA-F0-9]+$/;
const BUY_SHARES_SELECTOR = "0xd1a93d18";

export const DEFAULT_PROPERTY_SHARES_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const HARDHAT_CHAIN_ID = "0x7a69";
export const PRICE_PER_SHARE_WEI = 10_000_000_000_000_000n;

function isProvider(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.request === "function",
  );
}

function assertProvider(provider) {
  if (!isProvider(provider)) {
    throw new Error("Ethereum provider is unavailable.");
  }
}

function assertAddress(address, label) {
  if (!ADDRESS_PATTERN.test(address)) {
    throw new Error(`${label} must be a valid Ethereum address.`);
  }
}

function toPositiveBigInt(value, label) {
  const nextValue = BigInt(value);
  if (nextValue <= 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return nextValue;
}

export function toHexQuantity(value) {
  const nextValue = BigInt(value);
  if (nextValue < 0n) {
    throw new Error("Hex quantity cannot be negative.");
  }
  return `0x${nextValue.toString(16)}`;
}

export function purchaseValueWei(shareAmount) {
  return toPositiveBigInt(shareAmount, "Share amount") * PRICE_PER_SHARE_WEI;
}

export function encodeBuyShares(shareAmount) {
  const encodedAmount = toPositiveBigInt(shareAmount, "Share amount")
    .toString(16)
    .padStart(64, "0");

  return `${BUY_SHARES_SELECTOR}${encodedAmount}`;
}

function parseHexQuantity(value, label) {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]+$/.test(value)) {
    throw new Error(`${label} must be a hex quantity.`);
  }
  return BigInt(value);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForReceipt(provider, transactionHash, pollIntervalMs, maxAttempts) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    });

    if (receipt) {
      if (receipt.status !== "0x1") {
        throw new Error("Purchase transaction reverted.");
      }
      return receipt;
    }

    if (pollIntervalMs > 0) {
      await sleep(pollIntervalMs);
    }
  }

  throw new Error("Timed out waiting for purchase receipt.");
}

export async function switchToLocalHardhat(provider) {
  assertProvider(provider);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HARDHAT_CHAIN_ID }],
    });
  } catch (error) {
    if (!error || error.code !== 4902) {
      throw new Error("Unable to switch MetaMask to Localhost 8545.");
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: HARDHAT_CHAIN_ID,
          chainName: "Localhost 8545",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: ["http://127.0.0.1:8545"],
        },
      ],
    });
  }
}

export async function buyPropertyShares(
  provider,
  {
    contractAddress = DEFAULT_PROPERTY_SHARES_ADDRESS,
    from,
    maxAttempts = 30,
    pollIntervalMs = 1000,
    shareAmount,
  },
) {
  assertProvider(provider);
  assertAddress(contractAddress, "Contract address");
  assertAddress(from, "Sender address");

  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId !== HARDHAT_CHAIN_ID) {
    throw new Error("Switch MetaMask to Localhost 8545 before purchasing.");
  }

  const transactionHash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: contractAddress,
        value: toHexQuantity(purchaseValueWei(shareAmount)),
        data: encodeBuyShares(shareAmount),
      },
    ],
  });

  if (
    typeof transactionHash !== "string" ||
    !TRANSACTION_HASH_PATTERN.test(transactionHash)
  ) {
    throw new Error("MetaMask did not return a transaction hash.");
  }

  const receipt = await waitForReceipt(
    provider,
    transactionHash,
    pollIntervalMs,
    maxAttempts,
  );
  const escrowBalanceHex = await provider.request({
    method: "eth_getBalance",
    params: [contractAddress, "latest"],
  });

  return {
    escrowBalanceWei: parseHexQuantity(escrowBalanceHex, "Escrow balance"),
    receipt,
    transactionHash,
  };
}
