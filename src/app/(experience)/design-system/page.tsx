import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import {
  Doodle,
  DoodleArrow,
  HandwrittenNote,
  LuggageTag,
  PaperCard,
  PassportStamp,
  Polaroid,
  PostageStamp,
  SectionLabel,
  Sticker,
  Tape,
  TicketCard,
} from "@/components/design-system";
import { LinkButton } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";
import type { StickerVariant } from "@/types/design-system";

export const metadata: Metadata = {
  title: "Design system",
};

const palette = [
  { name: "Warm ivory", value: "#f2ebe0", className: "bg-[var(--paper)]" },
  {
    name: "Paper white",
    value: "#fbf8f3",
    className: "bg-[var(--paper-white)]",
  },
  { name: "Near black", value: "#241e1c", className: "bg-[var(--ink)]" },
  {
    name: "Warm burgundy",
    value: "#592c2c",
    className: "bg-[var(--oxblood)]",
  },
  { name: "Muted red", value: "#b46258", className: "bg-[var(--red-muted)]" },
  { name: "Taupe", value: "#b7a594", className: "bg-[var(--taupe)]" },
] as const;

const stickerVariants: readonly StickerVariant[] = [
  "text",
  "location",
  "date",
  "classified",
  "girlfriend-approved",
  "boyfriend-certified",
  "do-not-open",
  "redeemed",
  "legendary",
  "top-secret",
  "star",
  "heart",
];

export default function DesignSystemPage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        aside={
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Sticker size="sm" variant="girlfriend-approved" />
            <Sticker size="sm" variant="boyfriend-certified" />
          </div>
        }
        description="An editorial foundation with the tactile evidence of a shared life: paper, stamps, scribbles and just enough internet-product polish."
        eyebrow="Development route · visual language"
        title="Luxury, with baggage tags."
      />

      <section className="py-14 sm:py-20">
        <SectionLabel index="01">Foundations</SectionLabel>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PaperCard className="min-h-[28rem] p-7 sm:p-10" elevated tone="ink">
            <Sticker position="top-right" size="sm" variant="classified" />
            <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-white/50 uppercase">
              Display serif · emotional voice
            </p>
            <p className="mt-16 max-w-3xl font-display text-6xl leading-[0.84] tracking-[-0.06em] text-[var(--paper)] sm:text-8xl lg:text-9xl">
              Worth keeping.
            </p>
            <HandwrittenNote className="mt-10" rotation={-2} tone="paper">
              even the mildly embarrassing bits
            </HandwrittenNote>
          </PaperCard>
          <PaperCard
            className="flex min-h-[28rem] flex-col justify-between p-7 sm:p-10"
            texture="grid"
            tone="white"
          >
            <div>
              <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
                Modern sans · interface voice
              </p>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
                Clear when it matters.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                Navigation, metadata and actions stay quiet and precise so the
                personal material can have the last word.
              </p>
            </div>
            <div className="mt-12">
              <DoodleArrow label="the useful bit" />
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/home">
                  Primary action <ArrowRight aria-hidden="true" size={14} />
                </LinkButton>
                <LinkButton href="/home" variant="secondary">
                  Quiet action
                </LinkButton>
              </div>
            </div>
          </PaperCard>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {palette.map((color) => (
            <div
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/35"
              key={color.name}
            >
              <div className={`h-24 ${color.className}`} />
              <div className="p-3">
                <p className="text-xs font-semibold">{color.name}</p>
                <p className="mt-1 font-mono text-[0.58rem] text-[var(--muted)] uppercase">
                  {color.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-14 sm:py-20">
        <SectionLabel index="02">Sticker sheet</SectionLabel>
        <PaperCard
          className="mt-8 min-h-[30rem] p-7 sm:p-12"
          texture="ruled"
          tone="white"
        >
          <Tape position="top-left" rotation={-4} size="lg" tone="rose" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-7 pt-8 sm:gap-x-7 sm:gap-y-9">
            {stickerVariants.map((variant, index) => (
              <Sticker
                key={variant}
                rotation={[-3, 2, -1, 4, -4, 3][index % 6]}
                size={index % 4 === 0 ? "lg" : "md"}
                variant={variant}
              />
            ))}
          </div>
          <div className="mt-14 flex flex-wrap items-end gap-8">
            <HandwrittenNote rotation={-4}>
              deterministic chaos, very important
            </HandwrittenNote>
            <Doodle variant="star" />
            <Doodle size="lg" variant="spark" />
            <Doodle variant="heart" />
            <Doodle size="lg" variant="orbit" />
          </div>
        </PaperCard>
      </section>

      <section className="border-t border-[var(--line)] py-14 sm:py-20">
        <SectionLabel index="03">Travel ephemera</SectionLabel>
        <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
          <PaperCard
            className="grid min-h-[32rem] place-items-center p-8"
            tone="taupe"
          >
            <div className="relative grid w-full max-w-lg grid-cols-2 items-center gap-8">
              <PostageStamp country="Colombia" tone="burgundy" year="2026" />
              <PassportStamp date="04 OCT 2025" location="Cartagena" />
              <PostageStamp
                className="justify-self-end"
                country="France"
                tone="blue"
                value="1.25"
              />
              <PassportStamp
                className="justify-self-end"
                date="YEAR ONE"
                location="London"
                rotation={6}
              />
            </div>
          </PaperCard>
          <div className="grid gap-5">
            <LuggageTag from="BOG" name="V + G / 01" to="FCO" />
            <PaperCard className="min-h-64 p-7" texture="grid" tone="ivory">
              <Tape position="top-right" rotation={5} tone="yellow" />
              <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                Field notes
              </p>
              <HandwrittenNote className="mt-10 block" rotation={-2} tone="ink">
                Flights, cities, missed trains and the reasons the distance was
                always worth it.
              </HandwrittenNote>
              <DoodleArrow
                className="mt-8"
                direction="right"
                label="file under: us"
              />
            </PaperCard>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-14 sm:py-20">
        <SectionLabel index="04">Photography placeholders</SectionLabel>
        <div className="mt-10 grid items-center justify-items-center gap-10 md:grid-cols-3">
          <Polaroid
            caption="The right photo goes here"
            label="Frame 01"
            rotation={-4}
            taped
          />
          <Polaroid
            caption="No stock romance allowed"
            label="Frame 02"
            orientation="square"
            rotation={2}
          />
          <Polaroid
            caption="Selected evidence"
            label="Frame 03"
            orientation="landscape"
            rotation={-1}
            taped
          />
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-14 sm:py-20">
        <SectionLabel index="05">Product surfaces</SectionLabel>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <TicketCard
            code="VG-001"
            description="A reusable product card with the personality of a physical keepsake."
            eyebrow="Date coupon"
            href="/coupons/breakfast-in-bed"
            title="Breakfast in bed"
          />
          <TicketCard
            code="VG-002"
            description="Status stickers layer cleanly without turning the interface into a craft shop explosion."
            eyebrow="Already used"
            status="Redeemed"
            statusVariant="redeemed"
            title="You pick the plan"
            tone="burgundy"
          />
          <TicketCard
            code="VG-000"
            description="Dark surfaces preserve the premium editorial side of the system."
            eyebrow="Financially unwise"
            status="Legendary"
            statusVariant="legendary"
            title="Unlimited shopping"
            tone="ink"
          />
        </div>
      </section>
    </div>
  );
}
