import { crewBy } from "./crews";
import { FUD_STAKE } from "./roles";
import { liveMove } from "./tokens";
import type { CrewPlan } from "./types";

export type DayScore = { trader: number; rugger: number; fud: number; total: number; moves: { trader: number | null; rugger: number | null; fud: number | null } };

/** Paper $ profit for a crew plan, using the demo live moves since lock */
export function scorePlan(plan: CrewPlan, now: number): DayScore {
  const split = plan.split ?? { trader: 5000, rugger: 5000, cash: 0 };
  const tMove = plan.trader ? liveMove(plan.trader, now) : null;
  const rMove = plan.rugger ? liveMove(plan.rugger, now) : null;
  const trader = tMove == null ? 0 : (split.trader * tMove) / 100;
  const rugger = rMove == null ? 0 : (split.rugger * -rMove) / 100;

  let fud = 0;
  let fMove: number | null = null;
  if (plan.fud) {
    const target = crewBy(plan.fud.crewId);
    const sym = target ? target.plan[plan.fud.side] : null;
    if (sym) {
      fMove = liveMove(sym, now);
      fud = (FUD_STAKE * (plan.fud.side === "trader" ? -fMove : fMove)) / 100;
    }
  }
  return { trader, rugger, fud, total: trader + rugger + fud, moves: { trader: tMove, rugger: rMove, fud: fMove } };
}
