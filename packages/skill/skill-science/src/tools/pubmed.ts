export interface PubMedResult {
  id: string
  title: string
  authors: string[]
  source: string
  pubdate: string
}

const NCBI_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export async function searchPubMed(term: string, retmax = 5): Promise<PubMedResult[]> {
  const searchUrl = `${NCBI_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${retmax}`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) {
    throw new Error(`NCBI ESearch failed: ${searchRes.status} ${searchRes.statusText}`)
  }
  const searchJson = (await searchRes.json()) as any
  const idList: string[] = searchJson.esearchresult?.idlist ?? []
  if (idList.length === 0) {
    return []
  }

  const summaryUrl = `${NCBI_BASE}/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`
  const summaryRes = await fetch(summaryUrl)
  if (!summaryRes.ok) {
    throw new Error(`NCBI ESummary failed: ${summaryRes.status} ${summaryRes.statusText}`)
  }
  const summaryJson = (await summaryRes.json()) as any
  const results: PubMedResult[] = []

  for (const id of idList) {
    const doc = summaryJson.result?.[id]
    if (doc) {
      results.push({
        id,
        title: doc.title ?? '',
        authors: (doc.authors ?? []).map((a: any) => a.name ?? ''),
        source: doc.source ?? '',
        pubdate: doc.pubdate ?? '',
      })
    }
  }

  return results
}
