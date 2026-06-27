const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const CHAIN_ID_PATTERN = /^0x[a-fA-F0-9]+$/;

function isEthereumProvider(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.request === "function",
  );
}

function normalizeAddress(value) {
  return typeof value === "string" && ADDRESS_PATTERN.test(value) ? value : null;
}

function normalizeChainId(value) {
  return typeof value === "string" && CHAIN_ID_PATTERN.test(value) ? value : null;
}

function firstAccount(accounts) {
  return Array.isArray(accounts) ? normalizeAddress(accounts[0]) : null;
}

function initialState(provider) {
  return {
    status: provider ? "ready" : "missing",
    address: null,
    shortAddress: null,
    chainId: null,
    error: null,
  };
}

export function getEthereum(globalScope = globalThis) {
  return isEthereumProvider(globalScope?.ethereum) ? globalScope.ethereum : null;
}

export function shortenAddress(address) {
  const normalizedAddress = normalizeAddress(address);
  return normalizedAddress
    ? `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`
    : "";
}

export function createWalletController(provider) {
  const ethereum = isEthereumProvider(provider) ? provider : null;
  const subscribers = new Set();
  let state = initialState(ethereum);

  function notify() {
    for (const subscriber of subscribers) {
      subscriber(state);
    }
  }

  function setState(nextState) {
    state = { ...state, ...nextState };
    notify();
  }

  function setAccount(address, chainId = state.chainId) {
    if (!address) {
      setState({
        status: ethereum ? "ready" : "missing",
        address: null,
        shortAddress: null,
        chainId,
        error: null,
      });
      return;
    }

    setState({
      status: "connected",
      address,
      shortAddress: shortenAddress(address),
      chainId,
      error: null,
    });
  }

  async function getChainId() {
    if (!ethereum) {
      return null;
    }

    try {
      return normalizeChainId(await ethereum.request({ method: "eth_chainId" }));
    } catch (_error) {
      return null;
    }
  }

  function handleAccountsChanged(accounts) {
    setAccount(firstAccount(accounts));
  }

  function handleChainChanged(chainId) {
    const normalizedChainId = normalizeChainId(chainId);
    if (normalizedChainId) {
      setState({ chainId: normalizedChainId, error: null });
    }
  }

  if (ethereum && typeof ethereum.on === "function") {
    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
  }

  return {
    getState() {
      return state;
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(state);

      return () => {
        subscribers.delete(subscriber);
      };
    },
    async connect() {
      if (!ethereum) {
        setState({ status: "missing", error: "MetaMask is not installed." });
        return;
      }

      setState({ status: "connecting", error: null });

      try {
        const address = firstAccount(
          await ethereum.request({ method: "eth_requestAccounts" }),
        );
        const chainId = await getChainId();

        if (!address) {
          setState({
            status: "ready",
            address: null,
            shortAddress: null,
            chainId,
            error: "MetaMask did not return a valid account.",
          });
          return;
        }

        setAccount(address, chainId);
      } catch (_error) {
        setState({
          status: "ready",
          address: null,
          shortAddress: null,
          error: "Wallet connection was rejected.",
        });
      }
    },
    reset() {
      setAccount(null);
    },
    dispose() {
      if (ethereum && typeof ethereum.removeListener === "function") {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
      subscribers.clear();
    },
  };
}
