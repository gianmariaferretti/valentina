import { Card, SectionHeader } from "./admin-shell";

export function ComingSoon({
  title,
  phase,
  items,
}: {
  title: string;
  phase: string;
  items: readonly string[];
}) {
  return (
    <div className="max-w-2xl">
      <SectionHeader subtitle={`Arriva con la ${phase}.`} title={title} />
      <Card>
        <p className="text-sm font-semibold">Cosa potrai fare qui:</p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-6">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
