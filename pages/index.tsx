// Burnie's Pixel Burn — Phantom + Token UI

import { useEffect, useState } from "react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import "../types/solana.d.ts";

const GRID_SIZE = 100;
const PIXEL_COST_TOKENS = 10000;
const MAX_SQUARES = 25;
const TOKEN_MINT = new PublicKey("DXrz89vHegFQndREph3HTLy2V5RXGus6TJhuvi9Xpump");
const BURN_ADDRESS = new PublicKey("11111111111111111111111111111111");
const DEV_FEE_ADDRESS = new PublicKey("GuvMYgVSFHBV3UgaAd8rnb23ofzZqUBJP3r8zBbundyC");
const COLORS = ["bg-pink-500", "bg-yellow-400", "bg-purple-400", "bg-blue-400", "bg-red-400"];
const RPC_URL = "https://api.mainnet-beta.solana.com";

export default function PixelGrid() {
  const [selected, setSelected] = useState<number[]>([]);
  const [owned, setOwned] = useState<number[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const [xHandle, setXHandle] = useState("");

  const connection = new Connection(RPC_URL);

  useEffect(() => {
    if (typeof window !== "undefined" && window.solana?.isPhantom) {
      window.solana.on("connect", () => {
        const provider = window.solana!;
        const pubkey = new PublicKey(provider.publicKey?.toString() || "");
        setWallet(pubkey.toBase58());
        fetchBalance(pubkey);
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      const response = await window.solana.connect();
      const pubkey = new PublicKey(response.publicKey?.toString() || "");
      setWallet(pubkey.toBase58());
      fetchBalance(pubkey);
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  };

  const fetchBalance = async (publicKey: PublicKey) => {
    try {
      const accounts = await connection.getTokenAccountsByOwner(publicKey, {
        mint: TOKEN_MINT,
      });
      let total = 0;
      for (const acct of accounts.value) {
        const data = await connection.getParsedAccountInfo(acct.pubkey);
        const parsedData = data.value?.data;
        if (
          parsedData &&
          typeof parsedData === "object" &&
          "parsed" in parsedData &&
          parsedData.parsed?.info?.tokenAmount?.uiAmount
        ) {
          total += parsedData.parsed.info.tokenAmount.uiAmount;
        }
      }
      setBalance(total);
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
  };

  const buyPixels = async () => {
    if (!wallet || !window.solana) {
      alert("Please connect your wallet first");
      return;
    }
    if (!xHandle.startsWith("https://x.com/")) {
      alert("Please enter a valid X.com profile URL");
      return;
    }

    const provider = window.solana;
    const fromPubkey = new PublicKey(provider.publicKey?.toString() || "");
    const associatedAddress = await getAssociatedTokenAddress(TOKEN_MINT, fromPubkey);

    const totalCost = selected.length * PIXEL_COST_TOKENS;
    const devFeeLamports = selected.length * 0.005 * 1e9;

    try {
      const burnIx = createTransferInstruction(
        associatedAddress,
        BURN_ADDRESS,
        fromPubkey,
        totalCost,
        [],
        TOKEN_MINT
      );

      const devIx = SystemProgram.transfer({
        fromPubkey,
        toPubkey: DEV_FEE_ADDRESS,
        lamports: Math.round(devFeeLamports),
      });

      const tx = new Transaction().add(burnIx, devIx);
      const signedTx = await provider.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      setOwned([...owned, ...selected]);
      setSelected([]);
      fetchBalance(fromPubkey);
    } catch (err) {
      console.error("Transaction failed", err);
      alert("Transaction failed. See console for details.");
    }
  };

  const handlePixelClick = (index: number) => {
    if (owned.includes(index)) return;
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else if (selected.length < MAX_SQUARES) {
      setSelected([...selected, index]);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans bg-gradient-to-br from-yellow-100 to-purple-100 min-h-screen flex flex-col">
      <div className="text-center py-8 bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/burnie-logo-glow.png')] bg-center bg-contain bg-no-repeat" />
        <div className="z-10 relative flex flex-col items-center gap-2">
          <img src="/burnie-logo-glow.png" alt="Burnie the Snake Logo" className="w-20 h-20" />
          <h1 className="text-4xl font-extrabold text-white drop-shadow-xl">
            🔥 Burnie's Pixel Burn
          </h1>
          <p className="mt-2 text-white text-md font-medium">
            Use $PXB to burn your way into Solana history — one pixel at a time.
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="mb-2">{wallet ? `Connected: ${wallet}` : "Not connected"}</p>
        {wallet && <p className="text-sm text-gray-700">Balance: {balance ?? "..."} $PXB</p>}
        <button
          onClick={connectWallet}
          className="mt-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          {wallet ? "Connected" : "Connect Wallet"}
        </button>
      </div>

      <div className="text-center space-y-3">
        <div>
          <label className="mr-2 font-medium">Choose Color:</label>
          <select
            className="border rounded px-3 py-1"
            value={colorIndex}
            onChange={(e) => setColorIndex(Number(e.target.value))}
          >
            {COLORS.map((c, idx) => (
              <option key={c} value={idx}>
                {c.replace("bg-", "")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">X Account URL:</label>
          <input
            type="url"
            className="border rounded px-3 py-1 w-80"
            placeholder="https://x.com/yourhandle"
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-center overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
            <div key={i} className="relative group">
              <div
                onClick={() => handlePixelClick(i)}
                className={`w-4 h-4 cursor-pointer border border-white transition-all duration-200 flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  owned.includes(i)
                    ? COLORS[colorIndex]
                    : selected.includes(i)
                    ? COLORS[colorIndex] + " scale-110 shadow-md"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                title={owned.includes(i) ? xHandle : "Click to select"}
              ></div>
              {owned.includes(i) && xHandle && (
                <a
                  href={xHandle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-medium">
          Selected Squares: {selected.length} / {MAX_SQUARES} (Cost: {selected.length * PIXEL_COST_TOKENS} $PXB + {(selected.length * 0.005).toFixed(3)} SOL Dev Fee)
        </p>
        <button
          disabled={selected.length === 0}
          onClick={buyPixels}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow hover:bg-green-600 disabled:opacity-50 transition"
        >
          Burn Tokens & Buy
        </button>
      </div>

      <footer className="text-center text-sm text-gray-600 pt-10 pb-4">
        <div className="flex flex-col items-center">
          <img src="/burnie-icon-sm.png" alt="Burnie Icon" className="w-5 h-5 mb-1 opacity-70" />
          <span>©2025 Burnie's Pixel Burn — Powered by SnakeDice DAO</span>
        </div>
      </footer>
    </div>
  );
}
