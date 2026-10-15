import "server-only";

import { createHash } from "node:crypto";

import {
  agreementNumber,
  treatyPreamble,
  treatySubtitle,
  treatyTitles,
  treatyVersion,
  type TreatyTitle,
} from "@/data/relationship-contract";

export const secretArticle = {
  number: 41,
  title: "THE CHOICE",
  clauses: [
    `Regardless of whether life takes us to London, Rome, Paris, Cartagena, or somewhere we have yet to discover, I cannot promise that every day will be easy.\n\nI cannot promise that we will always have the right answers, or that we will never make mistakes.\n\nBut I can promise that I will keep trying to understand you, to learn from my mistakes, and to find new ways to make you smile.\n\nBecause, among all the people I could have met, I met you.\n\nAnd if I could go back to that evening at the Black Lion, I would choose to meet you again.\n\nI would choose you again.`,
  ],
} as const;

export interface ContractDocument {
  agreementNumber: string;
  version: string;
  subtitle: string;
  preamble: string[];
  titles: TreatyTitle[];
  sealedArticle: typeof secretArticle;
  effectiveDate: string;
  expiryDate: string;
}

export function currentContractDocument(): ContractDocument {
  return {
    agreementNumber,
    version: treatyVersion,
    subtitle: treatySubtitle,
    preamble: [...treatyPreamble],
    titles: treatyTitles.map((title) => ({
      ...title,
      articles: title.articles.map((article) => ({
        ...article,
        clauses: [...article.clauses],
      })),
    })),
    sealedArticle: secretArticle,
    effectiveDate: "31 October 2026",
    expiryDate: "31 October 2031",
  };
}

export function contractHash(document: ContractDocument): string {
  // JSONB normalises object key order; hash a canonical representation so a
  // database round-trip cannot make an unchanged signed document look altered.
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, canonical(entry)]),
      );
    }
    return value;
  }
  return createHash("sha256")
    .update(JSON.stringify(canonical(document)))
    .digest("hex");
}

export function parseArchivedDocument(value: unknown): ContractDocument | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ContractDocument>;
  if (
    candidate.agreementNumber !== agreementNumber ||
    typeof candidate.version !== "string" ||
    !Array.isArray(candidate.titles) ||
    candidate.titles.length !== 8 ||
    candidate.titles.flatMap((title) => title.articles ?? []).length !== 40 ||
    candidate.sealedArticle?.number !== 41
  )
    return null;
  return candidate as ContractDocument;
}
