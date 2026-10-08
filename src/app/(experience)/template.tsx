import type { ReactNode } from "react";

export default function ExperienceTemplate({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <div className="route-transition">{children}</div>;
}
