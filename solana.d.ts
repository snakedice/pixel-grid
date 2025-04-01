// solana.d.ts

import type { Transaction } from "@solana/web3.js";

interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: {
    toString(): string;
  };
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  on: (event: string, handler: () => void) => void;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

interface Window {
  solana?: SolanaProvider;
}
