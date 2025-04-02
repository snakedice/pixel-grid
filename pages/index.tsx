import { useState, useEffect } from 'react';
import Image from 'next/image';
import BurnieLogo from '../public/burnie-logo.png';
import { Connection, PublicKey, Transaction, SystemProgram, Finality } from '@solana/web3.js';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const DEV_FEE_PER_PIXEL_SOL = 0.005;
const EXTRA_FEE_PER_SMALL_LANDMARK = 0.2;
const EXTRA_FEE_PER_LARGE_LANDMARK = 0.5;
const MAX_SELECTION = 3000;
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

export default function Home() {
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [selectedPixels, setSelectedPixels] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState('purple');
  const [username, setUsername] = useState('');
  const [grid, setGrid] = useState(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null)));

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
      (window as any).solana.connect({ onlyIfTrusted: true }).then(({ publicKey }: any) => {
        setWallet(publicKey);
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      if ((window as any).solana) {
        const response = await (window as any).solana.connect();
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
        const newPixels = blockKeys.filter(k => !selectedPixels.find(p => p.key === k)).map(k => {
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

    const signed = await (window as any).solana.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction({ signature: txid, blockhash, lastValidBlockHeight }, 'confirmed');
    alert('Transaction sent! Check Solana explorer.');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white flex flex-col items-center p-4 font-sans">
      <header className="flex items-center gap-4 mb-6">
        <Image src={BurnieLogo} alt="Burnie the Snake Logo" width={60} height={60} />
        <div>
          <h1 className="text-4xl font-extrabold text-yellow-400">Burnie’s Pixel Burn</h1>
          <p className="text-sm text-gray-300">Burn your way into Solana history with $PXB — one pixel at a time.</p>
        </div>
      </header>

      <div className="mb-4">
        {wallet ? (
          <p>Connected: {wallet.toString()}</p>
        ) : (
          <button onClick={connectWallet} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded shadow-md hover:bg-yellow-400">Connect Wallet</button>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
          <option value="purple">purple</option>
          <option value="red">red</option>
          <option value="green">green</option>
          <option value="blue">blue</option>
          <option value="black">black</option>
          <option value="pink">pink</option>
        </select>
        <input
          type="text"
          placeholder="https://x.com/yourhandle"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="px-2 border rounded text-black"
        />
      </div>

      <p className="mb-2">Selected: {selectedPixels.length} / {MAX_SELECTION}</p>

      <button
        onClick={handleBurn}
        disabled={selectedPixels.length === 0 || !wallet}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
      >
        Burn Tokens & Buy
      </button>

      <div className="overflow-auto border border-gray-700">
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_WIDTH}, 10px)` }}>
          {grid.flatMap((rowArray, rowIdx) =>
            rowArray.map((_, colIdx) => {
              const key = `${rowIdx},${colIdx}`;
              const landmark = isInLandmark(rowIdx, colIdx);
              const selected = selectedPixels.find(p => p.key === key);
              const pixelColor = selected ? selected.color : landmark ? landmark.color : 'white';
              const baseFee = DEV_FEE_PER_PIXEL_SOL;
              const extraFee = landmark ? landmark.premium : 0;
              const total = baseFee + extraFee;
              const styles = {
                backgroundColor: pixelColor,
                border: '1px solid #333',
                width: '10px',
                height: '10px',
              };
              return (
                <div
                  key={key}
                  onClick={() => togglePixel(rowIdx, colIdx)}
                  style={styles}
                  title={`${landmark ? landmark.name + ' - ' : ''}${total.toFixed(3)} SOL`}
                >
                  {grid[rowIdx][colIdx]?.username && (
                    <a href={grid[rowIdx][colIdx].username} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <footer className="mt-10 text-sm text-gray-400">
        <p>©2025 Burnie’s Pixel Burn — Powered by SnakeDice DAO</p>
      </footer>
    </main>
  );
}
