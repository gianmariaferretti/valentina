"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  LockKeyhole,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import { privateCollection as offer } from "@/data/private-collection";
import { accessPrivateCollection } from "../actions/private-collection-actions";
import type {
  CollectionIntent,
  CollectionView,
} from "../lib/private-collection-domain";
import styles from "./private-collection.module.css";

function ProductCard() {
  return (
    <article className={styles.product}>
      <div className={styles.sealedPhotograph} aria-hidden="true">
        <span className={styles.monogram}>V + G</span>
        <LockKeyhole size={20} strokeWidth={1} />
        <span>PRIVATE COLLECTION · 01</span>
      </div>
      <div className={styles.productCopy}>
        <span className={styles.stamp}>CONFIDENTIAL</span>
        <h2>{offer.product}</h2>
        <p>{offer.description}</p>
        <span className={styles.price}>{offer.price}</span>
      </div>
    </article>
  );
}

/** No input element: cannot accept typing, autofill, paste or banking credentials. */
function DisplayField({
  label,
  value,
  masked = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly masked?: boolean;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <span id={id}>{label}</span>
      <div
        role="textbox"
        aria-readonly="true"
        aria-labelledby={id}
        aria-describedby={`${id}-value`}
        tabIndex={0}
        className={masked ? styles.masked : undefined}
      >
        <span id={`${id}-value`}>{value}</span>
      </div>
    </div>
  );
}

function OrderSummary() {
  return (
    <aside className={styles.summary} aria-label="Order summary">
      <h2>ORDER SUMMARY</h2>
      <p className={styles.orderProduct}>One Private Photograph</p>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{offer.price}</dd>
        </div>
        <div className={styles.total}>
          <dt>Total</dt>
          <dd>{offer.price}</dd>
        </div>
      </dl>
      <p className={styles.privateNote}>
        <LockKeyhole size={14} aria-hidden="true" /> For your eyes only.
      </p>
    </aside>
  );
}

export function PrivateCollection({
  onBack,
  titleRef,
}: {
  readonly onBack: () => void;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  const [view, setView] = useState<CollectionView>("collection");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const active = useRef(true);
  const submitting = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      titleRef.current?.focus();
      titleRef.current?.closest('[role="dialog"]')?.scrollTo({ top: 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [titleRef, view]);

  function focusView() {
    titleRef.current?.focus();
    titleRef.current?.closest('[role="dialog"]')?.scrollTo({ top: 0 });
  }

  function navigate(next: CollectionView) {
    if (submitting.current) return;
    setMessage("");
    setView(next);
  }

  function confirm(intent: CollectionIntent) {
    if (submitting.current) return;
    submitting.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await accessPrivateCollection(intent);
        if (!active.current) return;
        if (result.ok) setView(result.view);
        else setMessage(result.message);
      } catch {
        if (active.current)
          setMessage("Your request could not be confirmed. Please try again.");
      } finally {
        submitting.current = false;
      }
    });
  }

  const confirmed =
    view === "payment-requested" || view === "exchange-confirmed";
  const heading =
    view === "checkout"
      ? "PRIVATE CHECKOUT"
      : view === "exchange"
        ? "THE 10:1 EXCHANGE"
        : view === "payment-requested"
          ? "YOUR REQUEST HAS BEEN RECEIVED."
          : view === "exchange-confirmed"
            ? "DEAL ACCEPTED."
            : offer.title;

  return (
    <section className={styles.collection} aria-busy={pending}>
      <div className={styles.collectionNav}>
        {!confirmed ? (
          <button type="button" disabled={pending} onClick={onBack}>
            <ArrowLeft size={15} aria-hidden="true" /> BACK TO THE ARCHIVE
          </button>
        ) : null}
        <span>V&amp;G · PRIVATE EDITION</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
          onAnimationComplete={focusView}
        >
          <header
            className={`${styles.heading} ${confirmed ? styles.confirmationHeading : ""}`}
          >
            <span className={styles.eyebrow}>
              {confirmed ? "STRICTLY BETWEEN US" : "COLLECTION N° 01"}
            </span>
            <h1 id="archive-title" tabIndex={-1} ref={titleRef}>
              {heading}
            </h1>
            {view === "collection" ? <p>{offer.subtitle}</p> : null}
            {view === "exchange" ? <p>{offer.exchangeDescription}</p> : null}
          </header>

          {view === "collection" ? (
            <>
              <ProductCard />
              <div
                className={styles.options}
                aria-label="Choose your access option"
              >
                <button
                  type="button"
                  className={styles.option}
                  onClick={() => navigate("checkout")}
                >
                  <span className={styles.optionNumber}>
                    01 / STANDARD ACCESS
                  </span>
                  <strong>PAY €100</strong>
                  <span>Standard access.</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.option}
                  onClick={() => navigate("exchange")}
                >
                  <span className={styles.optionNumber}>
                    02 / THE PRIVATE EXCHANGE
                  </span>
                  <span className={styles.optionRatio}>
                    {offer.exchangeRatio}
                  </span>
                  <strong>EXCHANGE 10 PHOTOS</strong>
                  <span>{offer.exchangeDescription}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : null}

          {view === "checkout" ? (
            <div className={styles.checkout}>
              <div className={styles.checkoutDetails}>
                <section
                  className={styles.fieldGroup}
                  aria-label="Contact information"
                >
                  <h2>CONTACT INFORMATION</h2>
                  <DisplayField label="Full Name" value="Valentina" />
                  <DisplayField
                    label="Email Address"
                    value="Arranged privately"
                  />
                </section>
                <section
                  className={styles.fieldGroup}
                  aria-label="Payment details"
                >
                  <div className={styles.paymentHeading}>
                    <h2>PAYMENT DETAILS</h2>
                    <span
                      className={styles.cardBrands}
                      aria-label="Card payment presentation"
                    >
                      <CreditCard size={18} aria-hidden="true" />
                      <span>VISA</span>
                      <span>Mastercard</span>
                    </span>
                  </div>
                  <DisplayField
                    label="Card Number"
                    value="••••  ••••  ••••  ••••"
                    masked
                  />
                  <div className={styles.fieldRow}>
                    <DisplayField label="Expiration Date" value="MM / YY" />
                    <DisplayField label="CVV" value="•••" masked />
                  </div>
                  <DisplayField
                    label="Name on Card"
                    value="Arranged privately"
                  />
                </section>
                <p className={styles.paymentNote}>
                  Payment arranged privately. No charge is made here.
                </p>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={pending}
                  onClick={() => confirm("payment-request")}
                >
                  {pending ? "CONFIRMING REQUEST..." : "PAY €100.00"}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
              <OrderSummary />
            </div>
          ) : null}

          {view === "exchange" ? (
            <div className={styles.exchange}>
              <div className={styles.ratioPanel}>
                <span>{offer.exchangeRatio}</span>
                <p>THE PRIVATE EXCHANGE</p>
              </div>
              <div className={styles.exchangeDetails}>
                <dl>
                  <div>
                    <dt>WHAT YOU SEND</dt>
                    <dd>10 photographs.</dd>
                  </div>
                  <div>
                    <dt>WHAT YOU RECEIVE</dt>
                    <dd>1 exclusive photograph.</dd>
                  </div>
                  <div>
                    <dt>DELIVERY</dt>
                    <dd>Arranged privately.</dd>
                  </div>
                  <div>
                    <dt>PRICE</dt>
                    <dd>{offer.exchangePrice}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={pending}
                  onClick={() => confirm("exchange-agreement")}
                >
                  {pending ? "CONFIRMING AGREEMENT..." : "ACCEPT THE EXCHANGE"}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}

          {confirmed ? (
            <div className={styles.confirmation}>
              <motion.span
                className={styles.confirmationSeal}
                aria-hidden="true"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.4 }}
              >
                <Check size={28} strokeWidth={1} />
              </motion.span>
              {view === "exchange-confirmed" ? (
                <>
                  <p className={styles.confirmationSubtitle}>
                    Ten from you. One from me.
                  </p>
                  <span className={styles.agreementStamp}>
                    AGREEMENT CONFIRMED
                  </span>
                  <p>
                    Your exclusive photograph is waiting.
                    <br />
                    Come find Gianmaria to arrange the exchange.
                  </p>
                </>
              ) : (
                <>
                  <span className={styles.awaiting}>AWAITING PAYMENT</span>
                  <p>Contact Gianmaria to complete your purchase.</p>
                </>
              )}
              <div className={styles.confirmationActions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => navigate("collection")}
                >
                  RETURN TO THE PRIVATE COLLECTION
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={onBack}
                >
                  BACK TO THE ARCHIVE
                </button>
              </div>
            </div>
          ) : null}

          {view === "checkout" || view === "exchange" ? (
            <button
              type="button"
              className={styles.back}
              disabled={pending}
              onClick={() => navigate("collection")}
            >
              <ArrowLeft size={15} aria-hidden="true" /> RETURN TO THE PRIVATE
              COLLECTION
            </button>
          ) : null}
        </motion.div>
      </AnimatePresence>
      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}
