---
title: Stillas
summary: A platform for following up participants in work preparation programmes (AFT) – a counsellor app, a separate participant app, and operations with security and privacy built in.
period:
  start: "2026-02"
status: active
context: work
areas: [frontend, backend, data, devops, security]
stack: [TypeScript, React, Vite, TanStack Router, Tailwind CSS, Fastify, PostgreSQL, Prisma, Valkey, Python, Docker Compose, Caddy, GitHub Actions, Grafana]
featured: true
order: 2
related: [fagsystem-tillegg, fagsystem-migrering]
service:
  - The plan as direction, stages and next steps, in the participant's own words
  - Participants have their plan on their phone between meetings
  - The reports to NAV are built straight from the plan
technical:
  - Monorepo with two apps, a Fastify API and PostgreSQL
  - Signed images, deploy by digest, separate monitoring
  - Risk assessment using the Data Protection Authority and NSM methods
draft: false
---

<p class="part part-service">Part 1 · For the service</p>

## Follow-up as it actually happens

As a job consultant in AFT (a Norwegian work preparation programme), I follow up participants on their way into work.
Much of the job is structured conversation: mapping what a person can and wants to do, agreeing on a direction, breaking
it into steps, following up – and reporting the plan to NAV, the Norwegian labour and welfare administration.

Stillas brings that work into one tool, shaped by how follow-up actually happens, and puts the plan in the
participant's pocket between meetings. The platform is in active development and is not in production use yet.

## Two apps, two users

**The counsellor app** centres on the participant's plan: *direction → stages → next steps*. Around it:

- **Assessments** with established tools: skills and work styles from O\*NET, an interest profile (RIASEC), the HASP
  functional assessment and the Wheel of Life, plus a «road to work» measure that shows progress over time.
- **Conversations and follow-up rhythm**: a shared agenda and a meeting mode that pulls in what the participant has
  written since last time.
- **Plan to NAV**: the reports (first plan, revised plan, extension, final report) are built from the plan and can be
  approved by the participant before they are sent.
- **A company module** for employer contact, with a map, an occupation catalogue linking Norwegian STYRK-08 occupations
  to O\*NET profiles, and job listings from NAV.

**The participant app** is a separate, installable PWA. Participants see their plan, answer «How did it go?» on their
steps, suggest changes and topics for the next meeting, chat with their counsellor and see appointments. It is a separate
app rather than a restricted view, so company and admin code never ships to the participant's browser.

### Professional principles in the design

| Principle | In Stillas |
| --- | --- |
| User participation | Participants contribute between meetings, suggest changes and approve the report |
| From problem to resource | The direction is written in the participant's own words, and assessments show what the person can and wants to do |
| Privacy as care | Access is controlled per participant, every read is logged, and data is anonymised after the programme ends |

---

<p class="part part-technical">Part 2 · Under the hood</p>

## Reference data

**The reference data** took its own work: a Python pipeline crosswalking O\*NET to STYRK-08 (with manually reviewed
overrides), AI-assisted translation of more than 5,200 work tasks into Norwegian in a reviewable format, and an admin tool
for importing data from a previous system.

## Architecture and operations

![Architecture sketch: the counsellor app and the participant app go through a Caddy reverse proxy to a Fastify API. The API and a background sync worker use PostgreSQL, Valkey and S3-compatible storage. GitHub Actions builds, scans and signs images that are published to GHCR per commit, and a deploy webhook verifies and pulls them. A separate monitoring stack collects logs, metrics and health checks.](../../../assets/projects/stillas/architecture.svg)

The code is a monorepo with three apps and shared packages. Real-time chat uses Server-Sent Events that only carry a
signal – the client fetches fresh data itself, so message content never passes through the stream. A background worker
syncs NAV job listings, the Brønnøysund business register and postal codes on a schedule.

Deployment and monitoring live in their own repositories. Images are built in CI, scanned, signed and tagged with the
commit SHA; a signed webhook verifies the signatures and pulls them – the server never builds anything. Monitoring runs
apart from the app, so it notices even if the app goes down.

## Security and privacy

Security and privacy were designed in from the start, since the system handles participant information:

- Staff sign in with a password and two-factor authentication or with Microsoft Entra ID; participants have their own login model, with Vipps as an option.
- Role-based access control, access to each participant based on department and assigned counsellor, and an audit log of changes and reads.
- Automatic anonymisation after the programme ends, and encrypted storage.
- Secrets encrypted with SOPS and age, with a written rotation routine.
- A hardened supply chain: GitHub Actions pinned to commit SHAs, signed images and automated dependency updates.
- A written risk assessment using the Norwegian Data Protection Authority's DPIA method and the National Security Authority's ICT security principles.

## What I learned

- **Domain knowledge is a design resource.** Many decisions came from knowing follow-up from the inside – for example
  that participants contribute between meetings, and that the direction is written in their own words.
- **Authentication is a discipline of its own.** Rotating refresh tokens with reuse detection, OIDC with PKCE and immediate
  session revocation taught me to protect every route by default – and to test the list of exceptions.
- **Operations is about trust.** Signed images, deploying by digest and monitoring that runs separately taught me to think
  about what happens when something goes wrong, not just how it should work.
- **Working with AI assistants needs structure.** The project was built with AI coding assistance, which worked best
  with written specs, plans and module docs that both I and the tool could hold on to.
