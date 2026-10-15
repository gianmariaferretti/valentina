import "server-only";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import type { ContractDocument } from "./document";
import type { ContractState } from "../types";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 58;
const NAVY = rgb(0.12, 0.19, 0.27);
const BURGUNDY = rgb(0.36, 0.17, 0.21);
const GOLD = rgb(0.62, 0.49, 0.29);
const CHARCOAL = rgb(0.22, 0.22, 0.22);

function pdfText(value: string): string {
  return value
    .replace(/™/g, "(TM)")
    .replace(/—|–/g, "-")
    .replace(/’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/✦/g, "*");
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of pdfText(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

export async function createContractPdf(
  document: ContractDocument,
  state: ContractState,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("The Relationship Contract - VG-2026-001");
  pdf.setAuthor("V&G Year One");
  pdf.setSubject("Private commemorative agreement without legal effect");
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const signed =
    state.status === "fully_executed" && state.signatures.length === 2;
  let page: PDFPage;
  let y = 0;

  function newPage(section: string) {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - 90;
    page.drawText("V&G  /  BUREAU OF BILATERAL AFFAIRS", {
      x: MARGIN,
      y: PAGE.height - 43,
      size: 8,
      font: sans,
      color: GOLD,
    });
    page.drawText(section.toUpperCase(), {
      x: MARGIN,
      y: PAGE.height - 58,
      size: 7,
      font: sans,
      color: NAVY,
    });
    page.drawLine({
      start: { x: MARGIN, y: PAGE.height - 66 },
      end: { x: PAGE.width - MARGIN, y: PAGE.height - 66 },
      thickness: 0.6,
      color: GOLD,
    });
  }

  function ensure(height: number, section: string) {
    if (y - height < 76) newPage(section);
  }

  function lines(
    text: string,
    font = serif,
    size = 11.2,
    leading = 16,
    indent = 0,
    color = CHARCOAL,
    section = "Agreement",
  ) {
    for (const line of wrap(
      text,
      font,
      size,
      PAGE.width - 2 * MARGIN - indent,
    )) {
      ensure(leading, section);
      page.drawText(line, { x: MARGIN + indent, y, size, font, color });
      y -= leading;
    }
  }

  function heading(text: string, size = 22, section = "Agreement") {
    ensure(size + 25, section);
    page.drawText(pdfText(text), {
      x: MARGIN,
      y,
      font: serif,
      size,
      color: NAVY,
    });
    y -= size + 15;
  }

  // A dedicated cover page is typeset, not captured from the browser.
  page = pdf.addPage([PAGE.width, PAGE.height]);
  page.drawRectangle({
    x: 32,
    y: 32,
    width: PAGE.width - 64,
    height: PAGE.height - 64,
    borderColor: GOLD,
    borderWidth: 1.2,
  });
  page.drawRectangle({
    x: 38,
    y: 38,
    width: PAGE.width - 76,
    height: PAGE.height - 76,
    borderColor: GOLD,
    borderWidth: 0.35,
  });
  page.drawText("V  &  G", {
    x: 227,
    y: 653,
    size: 38,
    font: serif,
    color: BURGUNDY,
  });
  page.drawText("BILATERAL AGREEMENT", {
    x: 199,
    y: 588,
    size: 10,
    font: sans,
    color: GOLD,
  });
  page.drawText("THE RELATIONSHIP", {
    x: 91,
    y: 508,
    size: 34,
    font: serif,
    color: NAVY,
  });
  page.drawText("CONTRACT", {
    x: 174,
    y: 464,
    size: 38,
    font: italic,
    color: BURGUNDY,
  });
  page.drawText(pdfText(document.subtitle), {
    x: 103,
    y: 408,
    size: 13,
    font: italic,
    color: CHARCOAL,
  });
  page.drawLine({
    start: { x: 135, y: 380 },
    end: { x: 460, y: 380 },
    thickness: 0.7,
    color: GOLD,
  });
  page.drawText("GIANMARIA FERRETTI", {
    x: 92,
    y: 338,
    size: 12,
    font: bold,
    color: NAVY,
  });
  page.drawText("VALENTINA", {
    x: 381,
    y: 338,
    size: 12,
    font: bold,
    color: NAVY,
  });
  page.drawText("THE ITALIAN PARTY", {
    x: 92,
    y: 321,
    size: 7,
    font: sans,
    color: GOLD,
  });
  page.drawText("THE COLOMBIAN PARTY", {
    x: 381,
    y: 321,
    size: 7,
    font: sans,
    color: GOLD,
  });
  page.drawText(`${document.agreementNumber}  /  VERSION ${document.version}`, {
    x: 190,
    y: 246,
    size: 9,
    font: sans,
    color: NAVY,
  });
  page.drawText(`EFFECTIVE ${document.effectiveDate.toUpperCase()}`, {
    x: 202,
    y: 226,
    size: 8,
    font: sans,
    color: CHARCOAL,
  });
  page.drawText(`INITIAL EXPIRY ${document.expiryDate.toUpperCase()}`, {
    x: 202,
    y: 210,
    size: 8,
    font: sans,
    color: CHARCOAL,
  });
  page.drawText(signed ? "SIGNED & SEALED" : "UNSIGNED REVIEW COPY", {
    x: 221,
    y: 163,
    size: 10,
    font: bold,
    color: BURGUNDY,
  });
  page.drawText("PRIVATE COMMEMORATIVE INSTRUMENT - NO LEGAL EFFECT", {
    x: 130,
    y: 83,
    size: 8,
    font: sans,
    color: GOLD,
  });

  newPage("Preamble");
  heading("PREAMBLE", 26, "Preamble");
  for (const paragraph of document.preamble) {
    lines(paragraph, serif, 11.2, 17, 0, CHARCOAL, "Preamble");
    y -= 12;
  }

  for (const title of document.titles) {
    newPage(`Title ${title.numeral}`);
    lines(`TITLE ${title.numeral}`, sans, 8, 13, 0, GOLD, title.title);
    heading(title.title, 22, title.title);
    for (const article of title.articles) {
      ensure(62, title.title);
      lines(
        `ARTICLE ${article.number} - ${article.title}`,
        bold,
        11.5,
        17,
        0,
        BURGUNDY,
        title.title,
      );
      y -= 5;
      article.clauses.forEach((clause, index) => {
        lines(
          `(${index + 1}) ${clause}`,
          serif,
          10.6,
          15.5,
          12,
          CHARCOAL,
          title.title,
        );
        y -= 7;
      });
      y -= 10;
    }
  }

  newPage(signed ? "Signatures and sealed article" : "Review copy");
  heading(signed ? "SIGNATURES" : "UNSIGNED REVIEW COPY", 24, "Signatures");
  lines(
    "This Agreement is symbolic and commemorative only. It is not legally binding and does not constitute an engagement, marriage or promise to marry.",
    serif,
    10.8,
    15.5,
    0,
    CHARCOAL,
    "Signatures",
  );
  y -= 18;
  lines(
    `Document SHA-256: ${state.hash}`,
    sans,
    7.7,
    12,
    0,
    GOLD,
    "Signatures",
  );
  y -= 16;
  if (signed) {
    for (const signature of state.signatures) {
      ensure(145, "Signatures");
      lines(
        signature.role === "colombian"
          ? "THE COLOMBIAN PARTY"
          : "THE ITALIAN PARTY",
        sans,
        8,
        12,
        0,
        GOLD,
        "Signatures",
      );
      const image = await pdf.embedPng(
        signature.image.slice("data:image/png;base64,".length),
      );
      const scaled = image.scaleToFit(310, 100);
      page.drawImage(image, {
        x: MARGIN,
        y: y - scaled.height,
        width: scaled.width,
        height: scaled.height,
      });
      y -= 105;
      lines(
        `${signature.name} - ${new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Rome" }).format(new Date(signature.signedAt))} Europe/Rome`,
        serif,
        10,
        14,
        0,
        NAVY,
        "Signatures",
      );
      y -= 17;
    }
    newPage("Sealed Article 41");
    heading("ARTICLE 41 - THE CHOICE", 23, "Sealed Article 41");
    for (const paragraph of document.sealedArticle.clauses[0].split("\n\n")) {
      lines(paragraph, italic, 12, 18, 0, CHARCOAL, "Sealed Article 41");
      y -= 15;
    }
  } else {
    lines(
      "Signature spaces remain blank. Article 41 is sealed until both Parties have signed the same archived version.",
      italic,
      11,
      17,
      0,
      CHARCOAL,
      "Review copy",
    );
  }

  for (const [index, sheet] of pdf.getPages().entries()) {
    sheet.drawLine({
      start: { x: MARGIN, y: 62 },
      end: { x: PAGE.width - MARGIN, y: 62 },
      thickness: 0.5,
      color: GOLD,
    });
    sheet.drawText(
      `${document.agreementNumber}   /   ${signed ? "SIGNED & SEALED" : "UNSIGNED REVIEW COPY"}`,
      { x: MARGIN, y: 47, size: 7, font: sans, color: GOLD },
    );
    sheet.drawText(`${index + 1} / ${pdf.getPageCount()}`, {
      x: PAGE.width - MARGIN - 30,
      y: 47,
      size: 7,
      font: sans,
      color: GOLD,
    });
  }
  return pdf.save();
}
