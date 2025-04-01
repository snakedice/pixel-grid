interface SolanaProvider {
  isPhantom?: boolean;
  publicKey: import("@solana/web3.js").PublicKey;
  connect: () => Promise<{ publicKey: import("@solana/web3.js").PublicKey }>;
  on: (event: string, callback: () => void) => void;
  signTransaction: (transaction: import("@solana/web3.js").Transaction) => Promise<import("@solana/web3.js").Transaction>;
}

interface Window {
  solana?: SolanaProvider;
}

export {};
