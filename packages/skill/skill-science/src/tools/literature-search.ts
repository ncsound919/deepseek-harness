export interface ArxivResult {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  link: string;
}

const ARXIV_API_BASE = "http://export.arxiv.org/api/query";

export async function searchArxiv(query: string, maxResults = 5): Promise<ArxivResult[]> {
  const url = `${ARXIV_API_BASE}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`arXiv API request failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  return parseArxivFeed(xml);
}

export function parseArxivFeed(xml: string): ArxivResult[] {
  const entries: ArxivResult[] = [];
  const entryRegex = /<entry>([\\s\\S]*?)<\\/entry>/g;
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const id = /<id>(.*?)<\\/id>/.exec(block)?.[1] ?? "";
    const title = /<title>([\\s\\S]*?)<\\/title>/.exec(block)?.[1]?.trim().replace(/\\s+/g, " ") ?? "";
    const summary = /<summary>([\\s\\S]*?)<\\/summary>/.exec(block)?.[1]?.trim().replace(/\\s+/g, " ") ?? "";
    const published = /<published>(.*?)<\\/published>/.exec(block)?.[1] ?? "";
    const authors = [...block.matchAll(/<name>(.*?)<\\/name>/g)].map((m) => m[1]);
    entries.push({ id, title, summary, authors, published, link: id });
  }
  return entries;
}
