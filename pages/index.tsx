import { useState, useEffect } from 'react';
import Image from 'next/image';
import BurnieLogo from '../public/burnie-logo.png';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const DEV_FEE_PER_PIXEL_SOL = 0.005;
const MAX_SELECTION = 50;
const GRID_WIDTH = 50;
const GRID_HEIGHT = 200;
const TOKEN_BURN_ADDRESS = new PublicKey('11111111111111111111111111111111');
const DEV_WALLET_ADDRESS = new PublicKey('GuvMYgVSFHBV3UgaAd8rnb23ofzZqUBJP3r8zBbundyC');
const TOKEN_MINT_ADDRESS = new PublicKey('DXrz89vHegFQndREph3HTLy2V5RXGus6TJhuvi9Xpump');

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
    const key = `${row},${col}`;
    const alreadySelected = selectedPixels.find(p => p.key === key);
    if (alreadySelected) {
      setSelectedPixels(selectedPixels.filter(p => p.key !== key));
    } else {
      if (selectedPixels.length >= MAX_SELECTION) return;
      setSelectedPixels([...selectedPixels, { row, col, color: selectedColor, username, key }]);
    }
  };

  const handleBurn = async () => {
    if (!wallet || selectedPixels.length === 0) return;
    const connection = new Connection(SOLANA_RPC);
    const devFee = selectedPixels.length * DEV_FEE_PER_PIXEL_SOL;

    const tx = new Transaction();
    tx.add(SystemProgram.transfer({
      fromPubkey: wallet,
      toPubkey: DEV_WALLET_ADDRESS,
      lamports: devFee * 1e9,
    }));

    tx.add(SystemProgram.transfer({
      fromPubkey: wallet,
      toPubkey: TOKEN_BURN_ADDRESS,
      lamports: 0, // placeholder
    }));

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet;

    const signed = await (window as any).solana.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txid);
    alert('Transaction sent! Check Solana explorer.');
  };

  const isPixelBurnLabel = (row: number, col: number) => {
    const label = 'PIXELBURN';
    if (row < 2) {
      const start = Math.floor((GRID_WIDTH - label.length) / 2);
      return col >= start && col < start + label.length ? label[col - start] : null;
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <header className="flex items-center gap-4 mb-6">
        <Image src={BurnieLogo} alt="Burnie the Snake Logo" width={60} height={60} />
        <div>
          <h1 className="text-3xl font-bold">🔥 Burnie's Pixel Burn</h1>
          <p className="text-sm">Use $PXB to burn your way into Solana history — one pixel at a time.</p>
        </div>
      </header>

      <div className="mb-4">
        {wallet ? (
          <p>Connected: {wallet.toString()}</p>
        ) : (
          <button onClick={connectWallet} className="px-4 py-2 bg-black text-white rounded">Connect Wallet</button>
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
          className="px-2 border rounded"
        />
      </div>

      <p className="mb-2">Selected: {selectedPixels.length} / {MAX_SELECTION} — Fee: {selectedPixels.length * DEV_FEE_PER_PIXEL_SOL} SOL</p>

      <button
        onClick={handleBurn}
        disabled={selectedPixels.length === 0 || !wallet}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
      >
        Burn Tokens & Buy
      </button>

      <div className="overflow-auto border border-gray-400">
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_WIDTH}, 10px)` }}>
          {grid.flatMap((rowArray, rowIdx) =>
            rowArray.map((_, colIdx) => {
              const pixelLabel = isPixelBurnLabel(rowIdx, colIdx);
              const key = `${rowIdx},${colIdx}`;
              const selected = selectedPixels.find(p => p.key === key);
              const pixelColor = selected ? selected.color : pixelLabel ? 'purple' : 'white';
              const isBorder = rowIdx < 2 && isPixelBurnLabel(rowIdx, colIdx);
              const styles = {
                backgroundColor: pixelColor,
                border: isBorder ? '1px solid black' : '1px solid #ccc',
                width: '10px',
                height: '10px',
              };
              const content = username && selected && selected.row === rowIdx && selected.col === colIdx
                ? <a href={username} target="_blank" rel="noopener noreferrer">&nbsp;</a>
                : null;
              return (
                <div
                  key={key}
                  onClick={() => togglePixel(rowIdx, colIdx)}
                  style={styles}
                  title={pixelLabel || ''}
                >
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>

      <footer className="mt-10 text-sm text-gray-700">
        <p>©2025 Burnie’s Pixel Burn — Powered by SnakeDice DAO</p>
      </footer>
    </main>
  );
}
