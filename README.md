# portfolio.flode.net

Source for my personal portfolio — **[portfolio.flode.net](https://portfolio.flode.net)**.

I work as a job consultant in vocational rehabilitation and have spent the last years building software for the people and workflows around me: from Excel/VBA scripts to Python data tooling, browser extensions and a full-stack platform with its own operations. The site tells that story and presents a handful of projects as short case studies, in Norwegian and English.

## Stack

- [Astro](https://astro.build) (static output) with TypeScript in strict mode
- Tailwind CSS v4 with the Flode design tokens (shadcn/ui names), Geist and Geist Mono
- Astro content collections with Zod schemas for projects, timeline and pages
- Vitest for unit tests, and Playwright with axe-core for end-to-end and accessibility tests
- Lighthouse CI with a 0.95 minimum score on every category
- GitHub Actions for CI, and GitHub Pages for hosting

## How it is put together

- **Content as data.** Each project is one Markdown file per language, with validated frontmatter. That frontmatter covers period, status, context, skill areas, stack, links and the two layers of a project card: what it gives the service, and how it is built. The front-page copy (hero, facts, principles and what I bring) lives in one YAML file per language, and the timeline in another. Listings, cards and timeline links are all generated from it, and an unknown project slug anywhere fails the build.
- **Two layers per case study.** Work projects are told first from the service side and then from under the hood. Case pages get a table of contents from their headings.
- **Two languages, one structure.** Norwegian lives at `/` and English at `/en/`. The build fails if a project exists in one language but not the other. The language switch points to the matching page, or to the section index if there is no match.
- **Progressive enhancement.** Every page is plain HTML and works without JavaScript. The project filter is a small script layered on top, and links such as `?area=devops` select a filter directly. Light and dark themes follow the system setting and can be toggled.
- **Guard rails.** A content-safety test checks all text and diagrams as part of the unit tests. It looks for e-mail addresses, IP addresses, internal hostnames, vendor names, credential-like strings and leftover placeholders. Several of the projects are work projects, so this matters.
- **Quality gates in CI.** CI runs a type check, unit tests, end-to-end tests with axe accessibility checks, and Lighthouse budgets on every push.

```
src/
  content/
    projects/{nb,en}/   case studies (one file per language)
    timeline/           timeline entries per language (lane: tech, people or both)
    home/               front-page copy per language
    pages/              about page
  assets/projects/      architecture diagrams (SVG)
  components/           Astro components
  i18n/                 routing helpers and UI strings
  lib/                  project model, sorting and validation (pure, unit-tested)
  pages/                routes for nb and en
tests/
  unit/                 Vitest
  e2e/                  Playwright + axe
```

## Running locally

Requires Node 22 and pnpm.

```sh
pnpm install
pnpm dev          # dev server
pnpm build        # static site in dist/
pnpm check        # astro check (types)
pnpm test         # unit tests, including content safety
pnpm test:e2e     # builds, previews and runs Playwright
pnpm lhci         # Lighthouse CI against the build (needs Chrome)
```

## Adding a project

Create `src/content/projects/nb/<slug>.md` and `src/content/projects/en/<slug>.md` with the same slug. Fields:

| Field | Notes |
| --- | --- |
| `title`, `summary` | `summary` can be at most 200 characters |
| `period` | `{ start: "YYYY-MM", end?: "YYYY-MM" }`; a bare `"YYYY"` is allowed when the month is unknown |
| `status` | `active`, `in-use`, `prototype` or `archived` |
| `context` | `work`, `personal`, `study` or `teaching` |
| `areas` | one or more of `frontend`, `backend`, `data`, `devops`, `ai`, `security` |
| `stack` | list of technologies |
| `featured`, `order` | featured projects come first; on the home page, featured `work` projects get the large two-layer card and the rest are shown as spare-time projects |
| `service`, `technical` | optional bullet lists for the two layers of the card: for the service, and under the hood |
| `facts` | optional `{ label, value }` pairs shown in the case header, such as number of users |
| `repo`, `links` | optional |
| `cover`, `coverAlt` | optional image; alt text is required when an image is set |
| `related` | slugs of other projects; an unknown slug fails the build |
| `draft` | drafts are validated but not rendered |

Work projects follow two parts, each opened by a small label: `<p class="part part-service">Del 1 · For tjenesten</p>` with the background and what it gives the service, then a `---` rule and `<p class="part part-technical">Del 2 · Under panseret</p>` with architecture and technical detail, ending with What I learned. Personal projects can use a looser structure. Diagrams go in `src/assets/projects/<slug>/` and are referenced with normal Markdown image syntax.

## License

The code is MIT-licensed. The written content and images are my own and not covered by that licence. See [LICENSE](LICENSE).
