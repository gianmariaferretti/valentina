"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useTransition } from "react";

import {
  authoriseGianmaria,
  endGianmariaSession,
  requestContractReward,
  signAsGianmaria,
  signAsValentina,
  withdrawSignature,
} from "../actions";
import type {
  ContractActionResult,
  ContractSignature,
  ContractState,
} from "../types";
import type { AdminConfigurationIssue } from "../lib/admin-crypto";
import { SignaturePad } from "./signature-pad";

function RomeDate({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Rome",
      }).format(new Date(value))}{" "}
      CET/CEST
    </time>
  );
}

function ArchivedSignature({ signature }: { signature: ContractSignature }) {
  return (
    <div className="contract-archived-signature">
      <p>
        {signature.role === "colombian"
          ? "The Colombian Party"
          : "The Italian Party"}
      </p>
      <Image
        alt={`Handwritten signature of ${signature.name}`}
        className="contract-archived-signature__image"
        height={240}
        src={signature.image}
        unoptimized
        width={700}
      />
      <strong>{signature.name}</strong>
      <span>
        <RomeDate value={signature.signedAt} />
      </span>
    </div>
  );
}

export function SigningDesk({
  state,
  isAdmin,
  adminConfigurationIssue,
}: {
  state: ContractState;
  isAdmin: boolean;
  adminConfigurationIssue: AdminConfigurationIssue;
}) {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [feedback, setFeedback] = useState<ContractActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const isFinal = state.status === "fully_executed";

  function run(operation: () => Promise<ContractActionResult>) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await operation();
        setFeedback(result);
        if (result.ok) {
          setImage(null);
          setReviewed(false);
          router.refresh();
        }
      } catch {
        setFeedback({
          ok: false,
          message:
            "The signing service did not respond. Your current signature and reward state have not been changed; refresh and try again.",
        });
      }
    });
  }

  return (
    <section
      aria-labelledby="signing-title"
      className="contract-signing"
      id="signatures"
    >
      <div className="contract-signing__heading">
        <p className="contract-overline">The signing chamber · VG-2026-001</p>
        <h2 id="signing-title">The act of signing.</h2>
        <p>
          This is a private, commemorative gesture, not a legally binding
          contract, engagement or marriage.
        </p>
      </div>

      <div aria-live="polite" className="contract-status">
        <span className="contract-status__dot" />
        {state.loadFailed
          ? "ARCHIVE TEMPORARILY UNAVAILABLE"
          : state.status === "awaiting_valentina"
            ? "AWAITING VALENTINA'S SIGNATURE"
            : state.status === "awaiting_countersignature"
              ? "AWAITING COUNTERSIGNATURE"
              : "FULLY EXECUTED"}
      </div>

      {state.loadFailed ? (
        <p className="contract-alert">
          The document remains readable, but signing is unavailable until the
          private archive responds. No signature will be stored locally.
        </p>
      ) : null}

      {!state.loadFailed && state.status === "awaiting_valentina" ? (
        <div className="contract-signing__paper">
          <p className="contract-overline">
            01 / Signature of the Colombian Party
          </p>
          <h3>Valentina, the floor is yours.</h3>
          <p>
            Read the Agreement, confirm your review, then draw your actual
            signature. Nothing is saved until you select “Sign Agreement”.
          </p>
          <SignaturePad label="Valentina's signature" onChange={setImage} />
          {image ? (
            <div className="contract-preview">
              <p>Signature preview</p>
              <Image
                alt="Preview of your handwritten signature"
                height={240}
                src={image}
                unoptimized
                width={700}
              />
            </div>
          ) : null}
          <label className="contract-check">
            <input
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
              type="checkbox"
            />
            <span>
              I have read and understood this commemorative Agreement.
            </span>
          </label>
          <button
            className="contract-primary-button"
            disabled={!image || !reviewed || pending}
            onClick={() => image && run(() => signAsValentina(image, reviewed))}
            type="button"
          >
            {pending ? "Archiving signature…" : "Sign Agreement"}
          </button>
        </div>
      ) : null}

      {state.signatures.length > 0 ? (
        <div className="contract-signatures-grid">
          {state.signatures.map((signature) => (
            <ArchivedSignature key={signature.role} signature={signature} />
          ))}
        </div>
      ) : null}

      {!state.loadFailed && state.status === "awaiting_countersignature" ? (
        <div className="contract-signing__paper">
          <p className="contract-overline">02 / Pending review</p>
          <h3>One signature is on the record.</h3>
          <p>
            Valentina may withdraw her signature until Gianmaria countersigns.
            Once both have signed, the archived document is final for this
            version.
          </p>
          <p>
            The reward request opens only after both handwritten signatures are
            archived. The general site password does not replace
            Gianmaria&apos;s separate authorisation.
          </p>
          <button
            className="contract-text-button"
            disabled={pending}
            onClick={() => run(withdrawSignature)}
            type="button"
          >
            Withdraw Valentina&apos;s signature
          </button>
        </div>
      ) : null}

      {!state.loadFailed &&
      state.status === "awaiting_countersignature" &&
      isAdmin ? (
        <div className="contract-signing__paper contract-signing__paper--admin">
          <p className="contract-overline">
            03 / Signature of the Italian Party
          </p>
          <h3>Gianmaria, your countersignature.</h3>
          <p>
            Review the same version of the Agreement and sign by hand. This
            action reveals the sealed Article 41.
          </p>
          <SignaturePad label="Gianmaria's signature" onChange={setImage} />
          {image ? (
            <div className="contract-preview">
              <p>Signature preview</p>
              <Image
                alt="Preview of your handwritten countersignature"
                height={240}
                src={image}
                unoptimized
                width={700}
              />
            </div>
          ) : null}
          <label className="contract-check">
            <input
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
              type="checkbox"
            />
            <span>
              I have read and understood this commemorative Agreement.
            </span>
          </label>
          <button
            className="contract-primary-button"
            disabled={!image || !reviewed || pending}
            onClick={() => image && run(() => signAsGianmaria(image, reviewed))}
            type="button"
          >
            {pending ? "Archiving countersignature…" : "Countersign Agreement"}
          </button>
        </div>
      ) : null}

      {!state.loadFailed &&
      !isAdmin &&
      state.status === "awaiting_countersignature" ? (
        <details className="contract-admin-entry">
          <summary>Gianmaria&apos;s private signing desk</summary>
          <p>
            A separate passphrase is required. The general site code is not
            sufficient.
          </p>
          {adminConfigurationIssue ? (
            <p className="contract-alert" role="status">
              {adminConfigurationIssue === "missing_access_secret"
                ? "The private signing service is not configured. Gianmaria must check the server access secret and redeploy."
                : "The separate signing passphrase is unavailable or invalid. Gianmaria must set a unique secret of at least 4 characters in Vercel Production and redeploy."}
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                run(() => authoriseGianmaria(passphrase));
                setPassphrase("");
              }}
            >
              <label htmlFor="contract-admin-code">
                Private administrator passphrase
              </label>
              <input
                autoComplete="off"
                id="contract-admin-code"
                maxLength={256}
                onChange={(event) => setPassphrase(event.target.value)}
                required
                type="password"
                value={passphrase}
              />
              <button
                className="contract-secondary-button"
                disabled={pending}
                type="submit"
              >
                Open signing desk
              </button>
            </form>
          )}
        </details>
      ) : null}

      {isAdmin ? (
        <button
          className="contract-text-button contract-admin-exit"
          onClick={() =>
            startTransition(async () => {
              await endGianmariaSession();
              router.refresh();
            })
          }
          type="button"
        >
          Close Gianmaria&apos;s signing desk
        </button>
      ) : null}

      {feedback ? (
        <p
          aria-live="assertive"
          className={
            feedback.ok
              ? "contract-feedback contract-feedback--ok"
              : "contract-feedback"
          }
        >
          {feedback.message}
        </p>
      ) : null}

      {isFinal ? (
        <div className="contract-reward" id="reward">
          <span className="contract-reward__seal" aria-hidden="true">
            V<span>&</span>G
          </span>
          <p className="contract-overline">
            Signed & sealed · A private privilege
          </p>
          <h2>Your Agreement has been signed.</h2>
          <p className="contract-reward__line">
            One treaty. Two signatures. A thousand adventures ahead.
          </p>
          <div className="contract-reward__claim">
            <h3>Unlock your reward</h3>
            <p>
              Congratulations, Valentina. By signing this historic bilateral
              Agreement, you have officially unlocked one final privilege. Your
              reward is waiting for you. To claim it, contact Gianmaria
              directly.
            </p>
            {state.rewardRequestedAt ? (
              <p className="contract-feedback contract-feedback--ok">
                Your request has been saved. Contact Gianmaria to claim your
                reward. <RomeDate value={state.rewardRequestedAt} />
              </p>
            ) : (
              <button
                className="contract-primary-button"
                disabled={pending}
                onClick={() => run(requestContractReward)}
                type="button"
              >
                {pending ? "Saving your request…" : "Claim my reward"}
              </button>
            )}
          </div>
          {isAdmin && state.rewardRequestedAt ? (
            <p className="contract-admin-notice">
              Gianmaria&apos;s desk: Valentina requested the reward on{" "}
              <RomeDate value={state.rewardRequestedAt} />. No automatic
              notification was sent.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
