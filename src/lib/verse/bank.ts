import { parseAbi } from "viem";

// Chog Verse Bank on Monad testnet. Addresses come from the deploy (contracts/script/Deploy.s.sol).
export const BANK_ADDRESS = (process.env.NEXT_PUBLIC_BANK_ADDRESS ?? "") as `0x${string}` | "";
export const TCHOG_ADDRESS = (process.env.NEXT_PUBLIC_TCHOG_ADDRESS ?? "") as `0x${string}` | "";
export const bankLive = () => !!BANK_ADDRESS && !!TCHOG_ADDRESS;

export const bankAbi = parseAbi([
  "function enter(uint256 season, uint256 chogId)",
  "function entryFee() view returns (uint256)",
  "function pot(uint256 season) view returns (uint256)",
  "function entrant(uint256 season, uint256 chogId) view returns (address)",
  "function settled(uint256 season) view returns (bool)",
  "function settle(uint256 season, address[][3] winners)",
  "event Settled(uint256 indexed season, uint256 pot, uint256 rolledOver)",
  "event Entered(uint256 indexed season, uint256 indexed chogId, address indexed player, uint256 amount)",
]);

export const tchogAbi = parseAbi([
  "function faucet()",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);
