import { useState, useEffect } from 'react';
import Image from 'next/image';
import BurnieLogo from '../public/burnie-logo.png';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const DEV_FEE_PER_PIXEL_SOL = 0.005;
const EXTRA_FEE_PER_SMALL_LANDMARK = 0.2;
const EXTRA_FEE_PER_LARGE_LANDMARK = 0.5;
const GRID_WIDTH = 30;
const GRID_HEIGHT = 100;
const TOKEN_BURN_ADDRESS = new PublicKey('11111111111111111111111111111111');
const DEV_WALLET_ADDRESS = new PublicKey('GuvMYgVSFHBV3UgaAd8rnb23ofzZqUBJP3r8zBbundyC');
const TOKEN_MINT_ADDRESS = new PublicKey('DXrz89vHegFQndREph3HTLy2V5RXGus6TJhuvi9Xpump');

const LANDMARKS = [
  { name: 'City Hall', top: 40, left: 10, width: 10, height: 10, color: 'gold', premium: EXTRA_FEE_PER_LARGE_LANDMARK },
  { name: 'Casino', top: 70, left: 5, width: 10, height: 10, color: 'purple', premium: EXTRA_FEE_PER_LARGE_LANDMARK },
  { name: 'Mansion 1', top: 5, left: 2, width: 5, height: 5, color: 'lightblue', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Mansion 2', top: 5, left: 23, width: 5, height: 5, color: 'lightblue', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Mansion 3', top: 15, left: 2, width: 5, height: 5, color: 'lightblue', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Mansion 4', top: 15, left: 23, width: 5, height: 5, color: 'lightblue', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Mansion 5', top: 25, left: 12, width: 5, height: 5, color: 'lightblue', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Police Station', top: 60, left: 2, width: 5, height: 5, color: 'blue', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Fire Station', top: 60, left: 23, width: 5, height: 5, color: 'red', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Restaurant', top: 80, left: 23, width: 5, height: 5, color: 'orange', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
  { name: 'Gas Station', top: 80, left: 2, width: 5, height: 5, color: 'gray', premium: EXTRA_FEE_PER_SMALL_LANDMARK },
];

function isInLandmark(row: number, col: number) {
  return LANDMARKS.find(({ top, left, width, height }) => {
    return row >= top && row < top + height && col >= left && col < left + width;
  });
}

interface Pixel {
  row: number;
  col: number;
  color: string;
  username: string;
  key: string;
}

export default function Home() {
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [selectedPixels, setSelectedPixels] = useState<Pixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('purple');
  const [username, setUsername] = useState<string>('');
  const [grid, setGrid] = useState<Array<Array<null>>>(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null)));
  const [mode, setMode] = useState<string>('mobile');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.solana?.isPhantom) {
      window.solana.connect({ onlyIfTrusted: true }).then(({ publicKey }: { publicKey: PublicKey }) => {
        setWallet(publicKey);
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (window.solana) {
        const response = await window.solana.connect();
        setWallet(response.publicKey);
      }
    } catch (err: any) {
      if (err?.message?.includes('User rejected')) {
        alert('Wallet connection was rejected. Please try again.');
      } else {
        console.error('Wallet connection error:', err);
        alert('An unexpected error occurred when connecting wallet.');
      }
    }
  };

  const togglePixel = (row: number, col: number) => {
    const landmark = isInLandmark(row, col);
    if (landmark) {
      const blockKeys: string[] = [];
      for (let r = landmark.top; r < landmark.top + landmark.height; r++) {
        for (let c = landmark.left; c < landmark.left + landmark.width; c++) {
          blockKeys.push(`${r},${c}`);
        }
      }
      const allSelected = blockKeys.every(k => selectedPixels.find(p => p.key === k));
      if (allSelected) {
        setSelectedPixels(selectedPixels.filter(p => !blockKeys.includes(p.key)));
      } else {
        const newPixels: Pixel[] = blockKeys
          .filter(k => !selectedPixels.find(p => p.key === k))
          .map(k => {
            const [r, c] = k.split(',').map(Number);
            return { row: r, col: c, color: selectedColor, username, key: k };
          });
        setSelectedPixels([...selectedPixels, ...newPixels]);
      }
    } else {
      const key = `${row},${col}`;
      const alreadySelected = selectedPixels.find(p => p.key === key);
      if (alreadySelected) {
        setSelectedPixels(selectedPixels.filter(p => p.key !== key));
      } else {
        setSelectedPixels([...selectedPixels, { row, col, color: selectedColor, username, key }]);
      }
    }
  };

  const handleBurn = async () => {
    if (!wallet || selectedPixels.length === 0) return;
    const connection = new Connection(SOLANA_RPC);
    let devFee = selectedPixels.length * DEV_FEE_PER_PIXEL_SOL;
    selectedPixels.forEach(({ row, col }) => {
      const landmark = isInLandmark(row, col);
      if (landmark) {
        devFee += landmark.premium;
      }
    });

    const tx = new Transaction();
    tx.add(SystemProgram.transfer({
      fromPubkey: wallet,
      toPubkey: DEV_WALLET_ADDRESS,
      lamports: devFee * 1e9,
    }));
    tx.add(SystemProgram.transfer({
      fromPubkey: wallet,
      toPubkey: TOKEN_BURN_ADDRESS,
      lamports: 0,
    }));

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet;
    const signed = await window.solana!.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction({ signature: txid, blockhash, lastValidBlockHeight }, 'confirmed');
    alert('Transaction sent! Check Solana explorer.');
  };

  const totalSOL = selectedPixels.reduce((sum, { row, col }) => {
    const landmark = isInLandmark(row, col);
    return sum + DEV_FEE_PER_PIXEL_SOL + (landmark?.premium || 0);
  }, 0);

  // ... (the rest of the component remains unchanged)
}
