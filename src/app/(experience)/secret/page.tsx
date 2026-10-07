import type { Metadata } from "next";

import { RouteScaffold } from "@/components/ui/route-scaffold";

export const metadata: Metadata = { title: "Secret" };

export default function SecretPage() {
  return (
    <RouteScaffold
      description="A route hidden in plain sight, reserved for the experience’s least predictable idea."
      eyebrow="Nothing to see here"
      icon="secret"
      note="The route exists, access is protected, and its contents remain correctly classified."
      title="This is definitely not the secret."
    />
  );
}
