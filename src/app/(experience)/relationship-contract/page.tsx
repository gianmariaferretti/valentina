import type { Metadata } from "next";
import Link from "next/link";

import { SigningDesk } from "@/features/relationship-contract/components/signing-desk";
import { hasContractAdminSession } from "@/features/relationship-contract/lib/admin-session";
import { loadContract } from "@/features/relationship-contract/lib/repository";

import "./relationship-contract.css";

export const metadata: Metadata = {
  title: "The Relationship Contract™",
  description:
    "A private commemorative agreement between Gianmaria and Valentina.",
  robots: { index: false, follow: false },
};

export default async function RelationshipContractPage() {
  const [{ document, state }, isAdmin] = await Promise.all([
    loadContract(),
    hasContractAdminSession(),
  ]);
  const fullyExecuted = state.status === "fully_executed" && !state.loadFailed;

  return (
    <div className="contract-page">
      <div className="contract-frame">
        <nav aria-label="Contract breadcrumbs" className="contract-breadcrumbs">
          <Link href="/home">The private archive</Link>
          <span aria-hidden="true">/</span>
          <span>Diplomatic file 001</span>
        </nav>

        <header className="contract-cover" id="top">
          <div className="contract-cover__top">
            <span>V&G · Bureau of Bilateral Affairs</span>
            <span>File No. VG-2026-001</span>
          </div>
          <div className="contract-cover__crest" aria-hidden="true">
            <span>V</span>
            <i>&</i>
            <span>G</span>
          </div>
          <p className="contract-overline">
            An International Agreement Between Two Extremely Stubborn People
          </p>
          <h1>
            The Relationship
            <br />
            <em>Contract™</em>
          </h1>
          <p className="contract-cover__subtitle">{document.subtitle}</p>
          <div className="contract-cover__divider" aria-hidden="true">
            <span>✦</span>
          </div>
          <div className="contract-cover__parties">
            <div>
              <span>THE ITALIAN PARTY</span>
              <strong>Gianmaria Ferretti</strong>
            </div>
            <span aria-hidden="true">&</span>
            <div>
              <span>THE COLOMBIAN PARTY</span>
              <strong>Valentina</strong>
            </div>
          </div>
          <div className="contract-cover__dates">
            <span>Effective 31 October 2026</span>
            <span>Initial term · Five years</span>
            <span>Expires 31 October 2031</span>
          </div>
          <p className="contract-cover__notice">
            A private commemorative instrument · No legal effect
          </p>
          <span className="contract-cover__watermark" aria-hidden="true">
            V&G
          </span>
        </header>

        <div className="contract-body-layout">
          <aside className="contract-toc" aria-label="Table of contents">
            <p className="contract-overline">
              Contents · Version {state.version}
            </p>
            <a href="#preamble">
              Preamble <span>00</span>
            </a>
            {document.titles.map((title, index) => (
              <a
                href={`#title-${title.numeral.toLowerCase()}`}
                key={title.numeral}
              >
                {title.numeral}. {title.title.toLowerCase()}{" "}
                <span>{String(index + 1).padStart(2, "0")}</span>
              </a>
            ))}
            <a href="#signatures">
              Signatures <span>09</span>
            </a>
            {fullyExecuted ? (
              <a href="#article-41">
                The sealed article <span>10</span>
              </a>
            ) : null}
            <a
              className="contract-toc__download"
              href="/api/relationship-contract/pdf"
            >
              {fullyExecuted
                ? "Download signed certificate ↗"
                : "Download unsigned copy ↗"}
            </a>
          </aside>

          <main className="contract-document">
            <section className="contract-preamble contract-sheet" id="preamble">
              <div className="contract-sheet__folio">
                <span>VG-2026-001 / PREAMBLE</span>
                <span>PAGE 00</span>
              </div>
              <p className="contract-overline">
                Bilateral Agreement · London, Italy & Colombia
              </p>
              <h2>Preamble</h2>
              <div className="contract-preamble__text">
                {document.preamble.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="contract-sheet__footnote">
                Read together with all forty Articles. The sealed note is
                revealed only after both Parties sign.
              </p>
            </section>

            {document.titles.map((title, index) => (
              <section
                aria-labelledby={`title-heading-${title.numeral}`}
                className="contract-sheet contract-title"
                id={`title-${title.numeral.toLowerCase()}`}
                key={title.numeral}
              >
                <div className="contract-sheet__folio">
                  <span>VG-2026-001 / TITLE {title.numeral}</span>
                  <span>PAGE {String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="contract-title__intro">
                  <span className="contract-title__roman">{title.numeral}</span>
                  <div>
                    <p className="contract-overline">
                      Title {title.numeral} of VIII
                    </p>
                    <h2 id={`title-heading-${title.numeral}`}>
                      {title.title.toLowerCase()}
                    </h2>
                  </div>
                </div>
                <div className="contract-articles">
                  {title.articles.map((article) => (
                    <article
                      id={`article-${article.number}`}
                      key={article.number}
                    >
                      <div className="contract-article__number">
                        Art. {String(article.number).padStart(2, "0")}
                      </div>
                      <div>
                        <h3>{article.title.toLowerCase()}</h3>
                        {article.clauses.map((clause, clauseIndex) => (
                          <p key={clause}>
                            <span>({clauseIndex + 1})</span>
                            {clause}
                          </p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="contract-sheet__closing">
                  <span>Initial term: 31 Oct 2026 — 31 Oct 2031</span>
                  <span>V + G</span>
                </div>
              </section>
            ))}

            <section className="contract-execution-note contract-sheet">
              <div className="contract-sheet__folio">
                <span>VG-2026-001 / EXECUTION</span>
                <span>PAGE 09</span>
              </div>
              <p className="contract-overline">A note before signing</p>
              <h2>
                No legal magic. <em>Just us.</em>
              </h2>
              <p>
                This Agreement is a keepsake. Signing does not create a legal
                contract, marriage, engagement, promise to marry or obligation
                to remain together. The Parties keep their freedom and autonomy.
                The dates and signatures below record real moments, not invented
                ones.
              </p>
              <p className="contract-execution-note__hash">
                DOCUMENT VERSION {state.version} · SHA-256 {state.hash}
              </p>
              <a
                className="contract-inline-link"
                href="/api/relationship-contract/pdf"
              >
                Download{" "}
                {fullyExecuted ? "the signed certificate" : "an unsigned copy"}{" "}
                ↗
              </a>
            </section>

            <SigningDesk isAdmin={isAdmin} state={state} />

            {fullyExecuted ? (
              <section
                aria-labelledby="secret-heading"
                className="contract-secret contract-sheet"
                id="article-41"
              >
                <div className="contract-sheet__folio">
                  <span>VG-2026-001 / SEALED ANNEX</span>
                  <span>PAGE 10</span>
                </div>
                <span className="contract-secret__stamp">
                  SEAL BROKEN · BOTH SIGNATURES VERIFIED
                </span>
                <p className="contract-overline">
                  The hidden article · A personal note, not an obligation
                </p>
                <h2 id="secret-heading">
                  Article 41 — {document.sealedArticle.title.toLowerCase()}
                </h2>
                {document.sealedArticle.clauses[0]
                  .split("\n\n")
                  .map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                <span className="contract-secret__signature">Gianmaria</span>
              </section>
            ) : null}
          </main>
        </div>
        <footer className="contract-page__footer">
          <span>VG-2026-001 · A private commemorative agreement</span>
          <a href="#top">Return to cover ↑</a>
        </footer>
      </div>
    </div>
  );
}
