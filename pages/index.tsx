import "../types/solana"; // ✅ This forces Vercel to load your type definition

// Burnie's Pixel Burn — Phantom + Token UI

import { useEffect, useState } from "react";

const GRID_SIZE = 100; // 100x100 = 10,000 squares
const PIXEL_COST_TOKENS = 10000;
const MAX_SQUARES = 25;
const TOKEN_MINT = "DXrz89vHegFQndREph3HTLy2V5RXGus6TJhuvi9Xpump";
const BURN_ADDRESS = "11111111111111111111111111111111";
const COLORS = ["bg-pink-500", "bg-yellow-400", "bg-purple-400", "bg-blue-400", "bg-red-400"];

export default function PixelGrid() {
  const [selected, setSelected] = useState([]);
  const [owned, setOwned] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [listPrices, setListPrices] = useState({});
  const [images, setImages] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined" && window.solana && window.solana.isPhantom) {
      window.solana.on("connect", () => {
        setWallet(window.solana.publicKey.toString());
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      const response = await window.solana.connect();
      setWallet(response.publicKey.toString());
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  };

  const buyPixels = async () => {
    if (!wallet || !window.solana) {
      alert("Please connect your wallet first");
      return;
    }

    const totalCost = selected.length * PIXEL_COST_TOKENS;
    alert(`This is a placeholder. You would send ${totalCost} PXB to the burn address.`);
    setOwned([...owned, ...selected]);
    setSelected([]);
  };

  const handlePixelClick = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else if (selected.length < MAX_SQUARES) {
      setSelected([...selected, index]);
    }
  };

  const sellPixel = (index) => {
    const price = prompt("Enter list price in tokens for this square:", "20000");
    if (price) {
      setListPrices({ ...listPrices, [index]: parseFloat(price) });
      alert(`Listed square #${index} for ${price} tokens`);
    }
  };

  const uploadImage = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages({ ...images, [index]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans bg-gradient-to-br from-yellow-100 to-purple-100 min-h-screen flex flex-col">
      {/* Banner */}
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

      {/* Wallet Connection */}
      <div className="text-center">
        <p className="mb-2">{wallet ? `Connected: ${wallet}` : "Not connected"}</p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          {wallet ? "Connected" : "Connect Wallet"}
        </button>
      </div>

      {/* Pixel Grid */}
      <div className="flex justify-center overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
            <div key={i} className="relative group">
              <div
                onClick={() =>
                  owned.includes(i)
                    ? sellPixel(i)
                    : handlePixelClick(i)
                }
                title={
                  owned.includes(i)
                    ? listPrices[i]
                      ? `Listed: ${listPrices[i]} tokens`
                      : "Click to list for sale"
                    : "Click to select"
                }
                className={`w-4 h-4 cursor-pointer border border-white transition-all duration-200 flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  owned.includes(i)
                    ? "bg-black hover:brightness-110"
                    : selected.includes(i)
                    ? COLORS[i % COLORS.length] + " scale-110 shadow-md"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {images[i] ? (
                  <img src={images[i]} alt="logo" className="w-full h-full object-cover" />
                ) : listPrices[i] ? (
                  "💰"
                ) : (
                  ""
                )}
              </div>
              {owned.includes(i) && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadImage(e, i)}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  title="Upload image"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Area */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">
          Selected Squares: {selected.length} / {MAX_SQUARES} (Cost: {selected.length * PIXEL_COST_TOKENS} $PXB)
        </p>
        <button
          disabled={selected.length === 0}
          onClick={buyPixels}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow hover:bg-green-600 disabled:opacity-50 transition"
        >
          Burn Tokens & Buy
        </button>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-600 pt-10 pb-4">
        <div className="flex flex-col items-center">
          <img src="/burnie-icon-sm.png" alt="Burnie Icon" className="w-5 h-5 mb-1 opacity-70" />
          <span>©2025 Burnie's Pixel Burn — Powered by SnakeDice DAO</span>
        </div>
      </footer>
    </div>
  );
}