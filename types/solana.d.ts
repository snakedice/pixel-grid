export {};

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      publicKey?: {
        toString(): string;
        toBytes(): Uint8Array;
      };
      connect: () => Promise<{ publicKey: { toString(): string; toBytes(): Uint8Array } }>;
      on: (event: string, handler: () => void) => void;
      signTransaction: (tx: any) => Promise<any>;
    };
  }
}
