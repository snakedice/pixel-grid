// global.d.ts
interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (options?: any) => Promise<{ publicKey: import('@solana/web3.js').PublicKey }>;
      publicKey?: import('@solana/web3.js').PublicKey;
      signTransaction: (transaction: import('@solana/web3.js').Transaction) => Promise<import('@solana/web3.js').Transaction>;
    };
  }
  