export {};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }

  interface PhantomProvider {
    isPhantom?: boolean;
    publicKey: import("@solana/web3.js").PublicKey;
    connect: () => Promise<{ publicKey: import("@solana/web3.js").PublicKey }>;
    on: (event: string, handler: () => void) => void;
    signTransaction: (tx: import("@solana/web3.js").Transaction) => Promise<import("@solana/web3.js").Transaction>;
  }
}
