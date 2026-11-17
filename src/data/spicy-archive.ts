import type { ArchiveStage } from "@/features/secret/lib/archive-domain";

export type ArchiveScenes = Record<
  ArchiveStage,
  { title: string; paragraphs: readonly string[]; action?: string }
>;

export const archiveScenes: ArchiveScenes = {
  discovery: {
    title: "CLASSIFIED ARCHIVE",
    paragraphs: [
      "Access restricted. A personal file has been recovered from the V&G archive.",
    ],
    action: "OPEN THE DOSSIER",
  },
  curiosity: {
    title: "ACCESS RESTRICTED.",
    paragraphs: [
      "Subject: Gianmaria. Clearance level: Valentina Only.",
      "The first lock is the date this archive began. Check the Year One cover if you need a clue.",
    ],
    action: "VERIFY DATE",
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
    title: "THE INVESTIGATION",
    paragraphs: [
      "Three documents. One file reference.",
      "Read each piece of evidence before assembling the seal.",
    ],
    action: "SUBMIT EVIDENCE",
  },
  "sealed-file": {
    title: "FINAL DECRYPTION",
    paragraphs: [
      "SUBJECT: GIANMARIA",
      "CLEARANCE: VALENTINA ONLY",
      "AUTHORIZATION: PENDING",
    ],
    action: "OPEN THE FILE",
  },
  "photo-reveal": { title: "DECRYPTING PRIVATE FILE...", paragraphs: [] },
  "final-reveal": {
    title: "FOR YOUR EYES ONLY.",
    paragraphs: ["Some things are better kept between us."],
  },
};

export interface InvestigationDocument {
  readonly id: string;
  readonly token: string;
  readonly label: string;
  readonly clue: string;
}

export const investigationDocuments: readonly InvestigationDocument[] = [
  {
    id: "date",
    token: "31",
    label: "Document 01 · Origin",
    clue: "The file begins on the day our Year One record starts: 31 October 2025.",
  },
  {
    id: "recipient",
    token: "V",
    label: "Document 02 · Recipient",
    clue: "Clearance belongs to Valentina, and to Valentina only.",
  },
  {
    id: "subject",
    token: "G",
    label: "Document 03 · Subject",
    clue: "The person under investigation is Gianmaria.",
  },
];
