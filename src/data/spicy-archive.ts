import type { ArchiveStage } from "@/features/secret/lib/archive-domain";

export const archiveScenes: Record<
  ArchiveStage,
  { title: string; paragraphs: readonly string[]; action?: string }
> = {
  discovery: {
    title: "YOU FOUND SOMETHING.",
    paragraphs: ["Something you probably weren't supposed to find."],
    action: "CONTINUE ANYWAY",
  },
  curiosity: {
    title: "WHAT ARE YOU DOING HERE?",
    paragraphs: [
      "Seriously, Valentina.",
      "This part of the archive was supposed to remain confidential.",
      "But since you're already here...",
    ],
    action: "I'M JUST CURIOUS",
  },
  "age-confirmation": {
    title: "RESTRICTED AREA",
    paragraphs: [
      "This section contains private, flirtatious material intended for adults only.",
      "By continuing, you confirm that you are at least 18 years old.",
    ],
    action: "I'M 18 OR OLDER",
  },
  "point-of-no-return": {
    title: "ARE YOU ABSOLUTELY SURE?",
    paragraphs: [
      "Like... REALLY sure?",
      "YOU HAVE REACHED THE POINT OF NO RETURN.",
      "Well, technically you can still go back. But that would be terribly anticlimactic.",
    ],
    action: "YES. SHOW ME.",
  },
  "sealed-file": {
    title: "CLASSIFIED FILE",
    paragraphs: [
      "SUBJECT: VALENTINA",
      "SECURITY LEVEL: SPICY",
      "AUTHORIZATION: GRANTED",
    ],
    action: "BREAK THE SEAL",
  },
  "photo-reveal": { title: "DECRYPTING PRIVATE FILE...", paragraphs: [] },
  "final-reveal": {
    title: "FOR YOUR EYES ONLY.",
    paragraphs: ["Some things are better kept between us."],
  },
};
