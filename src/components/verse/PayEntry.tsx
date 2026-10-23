"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { monadTestnet } from "viem/chains";
import { useConfig, useConnect, useConnectors, useSwitchChain, useWriteContract } from "wagmi";
import { getConnection, readContract, waitForTransactionReceipt } from "wagmi/actions";
import { sfx } from "@/lib/sound";
import { useCall, type GameState } from "@/lib/verse/api";
import { BANK_ADDRESS, TCHOG_ADDRESS, bankAbi, bankLive, tchogAbi } from "@/lib/verse/bank";
import { ENTRY_FEE } from "@/lib/verse/roles";
import { useToast } from "./providers";

const FEE = parseEther(String(ENTRY_FEE));

// Holders pay 100 test $CHOG into the Bank on Monad testnet: faucet if needed, approve, enter, then the server verifies.
export function PayEntry({ g, compact = false }: { g: GameState; compact?: boolean }) {
  const toast = useToast();
  const call = useCall();
  const config = useConfig();
  const connectors = useConnectors();
  const { mutateAsync: connect } = useConnect();
  const { mutateAsync: switchChain } = useSwitchChain();
  const { mutateAsync: write } = useWriteContract();
  const [step, setStep] = useState<string | null>(null);

  if (!g.me || g.session?.kind !== "holder" || g.entryPaid) return null;

  const pay = async () => {
    if (!bankLive()) return;
    try {
      setStep("Connecting…");
      let account = getConnection(config).address;
      if (!account) account = (await connect({ connector: connectors[0] })).accounts[0];
      if (account.toLowerCase() !== g.session!.wallet) throw new Error("Switch your wallet to the one you signed in with");
      if (getConnection(config).chainId !== monadTestnet.id) {
        setStep("Switching to Monad testnet…");
        await switchChain({ chainId: monadTestnet.id });
      }
      const opts = { chainId: monadTestnet.id } as const;
      const bal = await readContract(config, { ...opts, address: TCHOG_ADDRESS as `0x${string}`, abi: tchogAbi, functionName: "balanceOf", args: [account] });
      if (bal < FEE) {
        setStep("Claiming test $CHOG…");
        const h = await write({ ...opts, address: TCHOG_ADDRESS as `0x${string}`, abi: tchogAbi, functionName: "faucet" });
        await waitForTransactionReceipt(config, { ...opts, hash: h });
      }
      const allowance = await readContract(config, { ...opts, address: TCHOG_ADDRESS as `0x${string}`, abi: tchogAbi, functionName: "allowance", args: [account, BANK_ADDRESS as `0x${string}`] });
      if (allowance < FEE) {
        setStep("Approving…");
        const h = await write({ ...opts, address: TCHOG_ADDRESS as `0x${string}`, abi: tchogAbi, functionName: "approve", args: [BANK_ADDRESS as `0x${string}`, FEE] });
        await waitForTransactionReceipt(config, { ...opts, hash: h });
      }
      setStep("Paying the Bank…");
      sfx.coin();
      const txHash = await write({ ...opts, address: BANK_ADDRESS as `0x${string}`, abi: bankAbi, functionName: "enter", args: [BigInt(g.clock.season), BigInt(g.me!.chogId)] });
      await waitForTransactionReceipt(config, { ...opts, hash: txHash });
      setStep("Confirming…");
      await call("/api/entry", { txHash });
      sfx.lock();
      toast({ title: `${ENTRY_FEE} $CHOG is in the vault`, body: "Chog entered for this season.", tone: "gold" });
    } catch (e) {
      sfx.fail();
      toast({ title: "Entry not paid", body: (e as Error).message.split("\n")[0].slice(0, 140), tone: "red" });
    } finally {
      setStep(null);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "card p-4"}`}>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg leading-tight">Pay your entry: {ENTRY_FEE} $CHOG</div>
        <p className="text-sm font-semibold opacity-65">{bankLive() ? "Only crews where all 4 Chogs paid can win the vault. Testnet $CHOG, free from the faucet." : "The Bank opens on Monad testnet soon. You can play meanwhile."}</p>
      </div>
      {bankLive() && (
        <button type="button" onClick={pay} disabled={!!step} className="btn btn-gold">
          {step ?? "Pay entry"}
        </button>
      )}
    </div>
  );
}
