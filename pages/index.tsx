// UI-Only Demo Version of 100 Million Token Homepage with Burnie Logo + 100x100 Grid

import { useState } from "react";

const GRID_SIZE = 100; // 100x100 = 10,000 squares
const PIXEL_COST_TOKENS = 10000; // cost per square in tokens
const MAX_SQUARES = 25;
const COLORS = ["bg-pink-500", "bg-yellow-400", "bg-purple-400", "bg-blue-400", "bg-red-400"];

export default function PixelGrid() {
  const [selected, setSelected] = useState([]);
  const [owned, setOwned] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [listPrices, setListPrices] = useState({});
  const [images, setImages] = useState({});

  const handlePixelClick = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else if (selected.length < MAX_SQUARES) {
      setSelected([...selected, index]);
    }
  };

  const connectWallet = () => {
    setWallet("DemoWallet123...abc");
  };

  const buyPixels = () => {
    setOwned([...owned, ...selected]);
    setSelected([]);
    alert(`Pretend to send ${selected.length * PIXEL_COST_TOKENS} TOKENS for ${selected.length} squares (burned to burn address).`);
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
      {/* Fun Banner */}
      <div className="text-center py-8 bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/4/4a/Solana_logo.png')] bg-center bg-contain bg-no-repeat" />
        <div className="z-10 relative flex flex-col items-center gap-2">
          <img
            src="https://cdn.snakedice.com/burnie/burnie-logo-glow.png"
            alt="Burnie the Snake Logo"
            className="w-16 h-16"
          />
          <h1 className="text-5xl font-extrabold text-white drop-shadow-xl">
            🐍 100 Million Token Homepage
          </h1>
          <p className="mt-2 text-white text-lg font-medium">
            Buy, flex, and burn tokens to own a piece of pixel history.
          </p>
        </div>
      </div>

      {/* Wallet + Status */}
      <div className="text-center">
        <p className="mb-2">{wallet ? `Connected: ${wallet}` : "Not connected"}</p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          {wallet ? "Connected" : "Connect Wallet"}
        </button>
      </div>

      {/* Grid */}
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

      {/* Buy Button + Count */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">
          Selected Squares: {selected.length} / {MAX_SQUARES} (Cost: {selected.length * PIXEL_COST_TOKENS} tokens)
        </p>
        <button
          disabled={selected.length === 0}
          onClick={buyPixels}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow hover:bg-green-600 disabled:opacity-50 transition"
        >
          Buy Selected
        </button>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-600 pt-10 pb-4">
        <div className="flex flex-col items-center">
          <img
            src="https://cdn.snakedice.com/burnie/burnie-icon-sm.png"
            alt="Burnie Icon"
            className="w-5 h-5 mb-1 opacity-70"
          />
          <span>©2025 100 Million Token Homepage, by SnakeDice DAO</span>
        </div>
      </footer>
    </div>
  );
}
