interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: {
    toString(): string;
  };
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  on: (event: string, handler: () => void) => void;
  signTransaction: (tx: import("@solana/web3.js").Transaction) => Promise<import("@solana/web3.js").Transaction>;
}

interface Window {
  solana?: SolanaProvider;
}
