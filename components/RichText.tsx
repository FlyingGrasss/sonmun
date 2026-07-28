type RichTextProps = {
  value: string;
};

export default function RichText({ value }: RichTextProps) {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6 text-gray-300">
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return (
            <h3 key={index} className="text-2xl font-bold text-white">
              {block.slice(4)}
            </h3>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="text-3xl font-bold text-white">
              {block.slice(3)}
            </h2>
          );
        }

        if (block.startsWith("# ")) {
          return (
            <h1 key={index} className="text-4xl font-bold text-[var(--color-accent)]">
              {block.slice(2)}
            </h1>
          );
        }

        if (block.split(/\r?\n/).every((line) => line.startsWith("- "))) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 text-lg leading-8">
              {block.split(/\r?\n/).map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-lg max-sm:text-sm leading-8">
            {block}
          </p>
        );
      })}
    </div>
  );
}
