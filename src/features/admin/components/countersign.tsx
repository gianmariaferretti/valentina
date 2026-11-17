"use client";

import Image from "next/image";
import { useState } from "react";

import { SignaturePad } from "@/features/relationship-contract/components/signature-pad";

import { buttonClass, useAdminAction, type ActionResult } from "./admin-ui";

export function Countersign({
  sign,
}: {
  sign: (image: string, reviewed: boolean) => Promise<ActionResult>;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const { pending, run } = useAdminAction();
  return (
    <div className="grid gap-3">
      <SignaturePad label="La tua firma" onChange={setImage} />
      {image ? (
        <Image
          alt="Anteprima della tua firma"
          className="max-w-xs rounded-xl border border-[var(--line)] bg-white"
          height={240}
          src={image}
          unoptimized
          width={700}
        />
      ) : null}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          checked={reviewed}
          className="size-5"
          onChange={(event) => setReviewed(event.target.checked)}
          type="checkbox"
        />
        Ho riletto il contratto.
      </label>
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={!image || !reviewed || pending}
        onClick={() => image && run(() => sign(image, reviewed))}
        type="button"
      >
        {pending ? "Archivio la firma…" : "Controfirma e svela l'Articolo 41"}
      </button>
    </div>
  );
}
