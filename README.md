# Chog Verse

**Team up with three other Chogs, out-trade every crew in the city, and get the $CHOG out of the vault in the bank. The vault opens every 7 days.**

Built for [Chogathon 2026](https://chogathon.chog.xyz/).

| | Link |
|---|---|
| Demo (play solo, guest pass, bots fill your crew, 30-min game days) | https://chog-verse-demo.vercel.app |
| Testnet (the real game, wallet login, entry paid on Monad testnet) | https://chog-verse.vercel.app |

## How it works

- **Crews of 4 Chogs** race through a 7-day season. Each Chog takes one role:
  - **Whale**: splits the crew's $10k between the picks and cash.
  - **Trader**: picks the token to pump.
  - **Rugger**: picks the token to crash.
  - **FUDder**: bets $1k against a rival crew's public pick.
- **Every day (UTC):** picks until 14:00, picks go public at 14:00 (Whale and FUDder act), everything locks at 15:00, scored 24 hours later on real prices.
- **Tokens:** the top 20 nad.fun tokens by market cap, with live prices.
- **The vault:** each Chog pays 100 $CHOG into the ChogBank. When the vault opens, the top 3 crews split it 50/30/15, paid on-chain automatically. 5% rolls into the next season.
- **Your Chog is your player:** pick any of the 1,969 Chog Genesis NFTs.

## Tech

- Next.js 16 (App Router), React 19, Tailwind 4, Motion, Three.js (the neon city)
- Postgres via Drizzle (Neon in production, embedded PGlite locally)
- wagmi + viem on Monad: wallet-signature login, Chog ownership on mainnet, entry and payout on testnet
- Foundry contracts: `contracts/` (ChogBank, TestChog)
- Vercel (two deploys of one codebase: `NEXT_PUBLIC_MODE=demo|live`) + Vercel Cron for the game engine

## Run locally

```shell
pnpm install
cp .env.example .env.local   # demo mode works with no database URL
pnpm dev -p 3001
```

Open http://localhost:3001.

## Onchain

- Chog Genesis NFT (Monad mainnet): `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`
- ChogBank (Monad testnet): `0xe77Ec2184cbb338FCdB1D0C1B985c6F28FAB9C9A`
- TestChog, test $CHOG (Monad testnet): `0x6b9C05ff1dDA77454D3C5F2A0136D2BE71b2fFc9`
