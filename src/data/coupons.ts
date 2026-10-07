import type { Coupon } from "@/types/content";

export const coupons = [
  {
    id: "breakfast-in-bed",
    code: "VG-001",
    title: "Breakfast in bed",
    description:
      "For mornings when vertical living feels needlessly ambitious.",
    category: "care",
    isImpossible: false,
  },
  {
    id: "pick-the-plan",
    code: "VG-002",
    title: "You pick the plan",
    description:
      "No vetoes, no ‘are you sure?’, and only minimal logistical panic.",
    category: "date",
    isImpossible: false,
  },
  {
    id: "unlimited-shopping",
    code: "VG-000",
    title: "Unlimited shopping",
    description:
      "An ambitious coupon currently under review by the finance department.",
    category: "wildcard",
    isImpossible: true,
  },
] as const satisfies readonly Coupon[];

export function getCoupon(id: string) {
  return coupons.find((coupon) => coupon.id === id);
}
