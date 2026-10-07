import { ArrowUpRight, Gift, Sparkles } from "lucide-react";
import Link from "next/link";

import { Sticker } from "@/components/design-system";
import type { GrantedExperienceReward } from "@/features/rewards/types";

export function RewardReveal({
  reward,
}: {
  readonly reward: GrantedExperienceReward;
}) {
  return (
    <aside className="reward-reveal" aria-label={reward.title}>
      <Sparkles
        aria-hidden="true"
        className="reward-reveal__spark reward-reveal__spark--one"
      />
      <Sparkles
        aria-hidden="true"
        className="reward-reveal__spark reward-reveal__spark--two"
      />
      <div className="reward-reveal__icon">
        <Gift aria-hidden="true" size={25} strokeWidth={1.4} />
      </div>
      <p>{reward.eyebrow}</p>
      <h2>{reward.title}</h2>
      <p>{reward.description}</p>
      <div className="reward-reveal__actions">
        <Sticker
          rotation={-3}
          size="sm"
          text={reward.newlyGranted ? "Discovered" : "Already discovered"}
          variant="legendary"
        />
        <Link href={reward.href}>
          {reward.actionLabel}
          <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </aside>
  );
}
