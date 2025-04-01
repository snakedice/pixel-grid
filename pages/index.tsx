// Burnie's Pixel Burn — Phantom + Token UI

import { useEffect, useState } from "react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import "../types/solana";

const GRID_SIZE = 100;
const PIXEL_COST_TOKENS = 10000;
const MAX_SQUARES = 25;
const TOKEN_MINT = new PublicKey("DXrz89vHegFQndREph3HTLy2V5RXGus6TJhuvi9Xpump");
const BURN_ADDRESS = new PublicKey("11111111111111111111111111111111");
const DEV_FEE_ADDRESS = new PublicKey("GuvMYgVSFHBV3UgaAd8rnb23ofzZqUBJP3r8zBbundyC");
const COLORS = ["bg-pink-500", "bg-yellow-400", "bg-purple-400", "bg-blue-400", "bg-red-400"];
const RPC_URL = "https://api.mainnet-beta.solana.com";

// ...rest of your index.tsx code...
