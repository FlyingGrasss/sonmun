export type ContentDocument = {
  title: string;
  url: string;
};

export function parseDocuments(value: FormDataEntryValue | null): ContentDocument[] {
  if (typeof value !== "string" || !value.trim()) return [];

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...urlParts] = line.split("|");
      const url = urlParts.join("|").trim();

      return {
        title: title.trim(),
        url,
      };
    })
    .filter((document) => document.title && document.url);
}

export function stringifyDocuments(value: unknown) {
  if (!Array.isArray(value)) return "";

  return value
    .map((item) => {
      if (
        item &&
        typeof item === "object" &&
        "title" in item &&
        "url" in item
      ) {
        return `${String(item.title)} | ${String(item.url)}`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
}
