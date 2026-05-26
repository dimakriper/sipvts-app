# SIPVTS — Technology Stack Decision Support System

A fullstack web application for analyzing GitHub repositories, discovering technology stacks, and supporting technology selection decisions using multi-criteria analysis (AHP).

Built with **Nuxt 4**, **Vue 3**, **TypeScript**, **Pinia**, and the **GitHub REST API**.

---

## What it does

**Repository Analytics** — add any public GitHub repository and instantly see its key metrics: popularity, development activity, team size, release cadence, language breakdown, and historical trends. Multiple repositories can be compared side by side.

**Stack Search** — enter a language and a search query to discover what technologies the most popular open-source projects in that space actually use. The system fetches real dependency manifests from GitHub, computes co-occurrence and Jaccard similarity between packages, detects communities of related tools, and surfaces frequent technology combinations via FP-Growth association rule mining.

**AHP Decision Support** — structure a multi-criteria technology comparison using the Analytic Hierarchy Process. Define criteria, fill in pairwise comparison matrices, and get ranked priorities with a consistency check.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Nuxt 4, Vue 3, TypeScript, Nuxt UI, Tailwind CSS |
| State | Pinia |
| Charts | Chart.js, force-graph |
| Backend | Nuxt Server API (Nitro) |
| Data | GitHub REST API v2022-11-28 |
| Analysis | FP-Growth (`node-fpgrowth`), Jaccard similarity, Label Propagation |

---

## Setup

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
# GitHub Personal Access Token (optional but strongly recommended)
# Without it: 10 Search API requests/min (unauthenticated)
# With it:    30 Search API requests/min + higher Contents API limits
NUXT_GITHUB_TOKEN=ghp_your_token_here
```

To generate a token: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.  
Required scopes: **Public repositories (read-only)** — no extra permissions needed.

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm run preview
```

---

> **GitHub rate limits:** without a token the Search API is limited to 10 requests/min. A personal access token with public repository read access is sufficient to lift all relevant limits.
