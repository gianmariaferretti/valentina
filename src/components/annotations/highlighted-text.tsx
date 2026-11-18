import { ink, Mark } from "./mark";
import { splitHighlights } from "./highlights";

/** Text where `==this==` gets a hand-drawn highlighter stroke. */
export function HighlightedText({ text }: { text: string }) {
  const parts = splitHighlights(text);
  if (!parts.some((part) => part.marked)) return <>{text}</>;
  let order = 0;
  return (
    <>
      {parts.map((part, index) =>
        part.marked ? (
          <Mark
            animationDuration={900}
            color={ink.highlighter}
            iterations={1}
            key={index}
            multiline
            order={order++}
            padding={[1, 3]}
            type="highlight"
          >
            {part.text}
          </Mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}
