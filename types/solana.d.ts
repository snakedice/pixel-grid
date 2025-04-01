export {};

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      publicKey?: {
        toString: () => string;
      };
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      on: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}
