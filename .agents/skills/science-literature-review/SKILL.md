---
name: science-literature-review
description: Use when running scientific literature reviews, cross-referencing papers across arXiv and PubMed, comparing findings, and formatting citations with full provenance.
---

# Scientific Literature Review Skill

A systematic, reproducible procedure for gathering and synthesizing scientific research using DeepSeek Harness.

## Protocol

1. **Formulate Search Queries**:
   - Split complex research questions into targeted domain keywords.
   - For physics/math/CS topics, query arXiv via `search_arxiv`.
   - For biomedical, life sciences, or clinical topics, query PubMed via `search_pubmed`.

2. **Extract Key Findings**:
   - Review abstracts/summaries for primary claims, methodology, sample sizes, and limitations.
   - Record author lists, publication dates, and persistent identifiers (arXiv ID, PMID).

3. **Cross-Validate Claims**:
   - Compare experimental conclusions against established constants via `lookup_physical_constant`.
   - Verify unit conversions and dimensional consistency via `convert_unit`.

4. **Synthesize & Cite**:
   - Provide summary tables comparing datasets, metrics, and outcomes across cited works.
   - Append canonical references with DOI/arXiv/PMID URLs.
