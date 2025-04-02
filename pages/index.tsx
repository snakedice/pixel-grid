import { useState, useEffect } from 'react';
import Image from 'next/image';
import BurnieLogo from '../public/burnie-logo.png';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const DEV_FEE_PER_PIXEL_SOL = 0.005;
const EXTRA_FEE_PER_SMALL_LANDMARK = 0.02;
const EXTRA_FEE_PER_LARGE_LANDMARK = 0.05;
const GRID_WIDTH = 30;
const GRID_HEIGHT = 100;
const TOKEN_BURN_PER_PIXEL = 10000;
const TOKEN_BURN_ADDRESS = new PublicKey('11111111111111111111111111111111');
const DEV_WALLET_ADDRESS = new PublicKey('GuvMYgVSFHBV3UgaAd8rnb23ofzZqUBJP3r8zBbundyC');
const TOKEN_MINT_ADDRESS = new PublicKey('DXrz89vHegFQndREph3HTLy2V5RXGus6TJhuvi9Xpump');

const LANDMARKS = [
  { name: 'City Hall', top: 40, left: 10, width: 10, height: 10, color: 'goldenrod', premium: EXTRA_FEE_PER_LARGE_LANDMARK },
  { name: 'Casino', top: 70, left: 5, width: 10, height: 10, color: 'violet', premium: EXTRA_FEE_PER_LARGE_LANDMARK },
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

  const totalPXB = selectedPixels.length * TOKEN_BURN_PER_PIXEL;

  return (
    <main className={`${darkMode ? 'bg-black text-white' : 'bg-white text-black'} min-h-screen flex flex-col items-center p-4`}>
      <header className="flex items-center gap-4 mb-6 w-full justify-between">
        <div className="flex items-center gap-4">
          <Image src={BurnieLogo} alt="Burnie the Snake Logo" width={60} height={60} />
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">🔥 Burnie's Pixel Burn</h1>
            <p className="text-sm">Use $PXB to burn your way into Solana history — one pixel at a time.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="px-2 py-1 border rounded">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <p className="mb-2 text-lg font-medium">Total Cost: {totalSOL.toFixed(3)} SOL + {totalPXB.toLocaleString()} $PXB</p>

      <div className="mb-4">
        {wallet ? (
          <p>Connected: {wallet.toString()}</p>
        ) : (
          <button onClick={connectWallet} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded shadow-md hover:bg-yellow-400">Connect Wallet</button>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className="text-black px-2">
          <option value="purple">Purple</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="blue">Blue</option>
          <option value="black">Black</option>
          <option value="pink">Pink</option>
          <option value="orange">Orange</option>
          <option value="yellow">Yellow</option>
          <option value="teal">Teal</option>
          <option value="brown">Brown</option>
        </select>
        <input
          type="text"
          placeholder="x username"
          value={username}
          onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          className="px-2 border rounded text-black"
        />
      </div>

      <button onClick={handleBurn} disabled={selectedPixels.length === 0 || !wallet} className="mb-4 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">Burn Tokens & Buy</button>

      <div className="overflow-auto border border-gray-400 mb-6">
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_WIDTH}, 10px)` }}>
          {grid.flatMap((rowArray, rowIdx) =>
            rowArray.map((_, colIdx) => {
              const key = `${rowIdx},${colIdx}`;
              const selected = selectedPixels.find(p => p.key === key);
              const landmark = isInLandmark(rowIdx, colIdx);
              const pixelColor = selected ? selected.color : landmark ? landmark.color : 'white';
              const border = landmark ? '1px solid black' : '1px solid #ccc';
              const cost = (DEV_FEE_PER_PIXEL_SOL + (landmark?.premium || 0)).toFixed(3);
              const title = `${landmark ? landmark.name + ' — ' : ''}${cost} SOL`;
              const href = selected?.username ? `https://x.com/${selected.username}` : undefined;
              return (
                <div
                  key={key}
                  onClick={() => togglePixel(rowIdx, colIdx)}
                  style={{ backgroundColor: pixelColor, border, width: '10px', height: '10px' }}
                  title={title}
                >
                  {href && <a href={href} target="_blank" rel="noopener noreferrer">&nbsp;</a>}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-center max-w-xl text-sm text-gray-300 mb-4">
        <p>PixelBurn is an experiment on Solana where users can purchase pixels in exchange for burning $PXB tokens and paying a small dev fee. Users can link their X account to each pixel(s). Future functionality will include NFT's linked to the pixels, games, and more.</p>
        <div className="flex gap-4 justify-center mt-2">
          <a href="https://x.com/greatswyckoff" target="_blank" className="underline">Follow us on X</a>
          <a href="https://t.me/pixelburnsol" target="_blank" className="underline">Join PixelBurn TG Community</a>
        </div>
      </div>

      <footer className="mt-10 text-sm text-gray-400 text-center">
        <p>©2025 Burnie’s Pixel Burn — Powered by <a className="underline" href="https://snakedice.com" target="_blank">SnakeDice DAO</a> — <a href="https://x.com/snakedicedao" className="underline" target="_blank">Follow SnakeDice on X</a></p>
      </footer>
    </main>
  );
}