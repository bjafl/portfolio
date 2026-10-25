---
title: Stillas
summary: Plattform for oppfølging av deltakere i arbeidsforberedende trening (AFT) – veileder-app, egen deltaker-app, og drift med sikkerhet og personvern bygget inn.
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
  - Planen som retning, etapper og neste steg, i deltakerens egne ord
  - Deltakeren har planen på mobilen mellom møtene
  - Rapportene til Nav bygges direkte fra planen
technical:
  - Monorepo med to apper, Fastify-API og PostgreSQL
  - Signerte images, deploy etter digest, separat overvåking
  - Risikovurdering etter Datatilsynets og NSMs metoder
draft: false
---

<p class="part part-service">Del 1 · For tjenesten</p>

## Oppfølgingen slik den faktisk foregår

Som jobbkonsulent i AFT følger jeg opp deltakere som er på vei mot arbeid. Mye av jobben er strukturert samtale: kartlegge
hva personen kan og vil, bli enige om en retning, dele den opp i overkommelige steg, følge opp jevnlig – og rapportere
planen videre til Nav.

Stillas samler det arbeidet i ett verktøy, formet av hvordan oppfølgingen faktisk foregår, og gir deltakeren planen sin på
mobilen mellom møtene. Plattformen er under aktiv utvikling og er ikke tatt i bruk i produksjon ennå.

## To apper, to brukere

**Veileder-appen** er bygget rundt deltakerens plan, organisert som *retning → etapper → neste steg*. Rundt planen ligger:

- **Kartlegging** med etablerte verktøy: ferdigheter og arbeidsstiler fra O\*NET, interesseprofil (RIASEC), HASP
  funksjonskartlegging og Livshjulet, pluss en «Veien mot arbeid»-måling som viser utvikling over tid.
- **Samtaler og oppfølgingsrytme**: en felles agenda og en møtemodus som henter inn det deltakeren har skrevet siden
  sist.
- **Plan til Nav**: rapportene (første plan, revidert plan, forlengelse, sluttrapport) bygges fra planen og kan godkjennes
  av deltakeren før de sendes.
- **Bedriftsmodul** for arbeidsgiverkontakt, med kart, en stillingskatalog som kobler norske STYRK-08-yrker til O\*NET-profiler,
  og stillingsannonser fra Nav.

**Deltaker-appen** er en egen PWA som kan installeres på mobilen. Der ser deltakeren planen sin, svarer på «Hvordan gikk
det?» på stegene, foreslår endringer og ting å ta opp neste gang, chatter med veilederen og ser avtaler. Den er bevisst
en separat app og ikke en begrenset visning av veileder-appen, slik at kode for bedriftsregister og administrasjon aldri
sendes til deltakerens nettleser.

### Fagprinsipper i designet

| Fagprinsipp | Blir i Stillas |
| --- | --- |
| Brukermedvirkning | Deltakeren bidrar mellom møtene, foreslår endringer og godkjenner rapporten |
| Fra problem til ressurs | Retningen skrives i deltakerens egne ord, og kartleggingen viser det personen kan og vil |
| Personvern som omsorg | Tilgang styres per deltaker, alt innsyn logges, og data anonymiseres etter avsluttet tiltak |

---

<p class="part part-technical">Del 2 · Under panseret</p>

## Datagrunnlaget

**Datagrunnlaget** krevde eget arbeid: et Python-løp som krysskobler O\*NET mot STYRK-08 (med manuelt gjennomgåtte
overstyringer), AI-assistert oversettelse av over 5 200 arbeidsoppgaver til norsk, i et format som kan gjennomgås før det tas inn, og et
admin-verktøy for import av data fra et tidligere system.

## Arkitektur og drift

![Arkitekturskisse: veileder-app og deltaker-app går via en Caddy reverse proxy til et Fastify-API. API-et og en bakgrunnsjobb for synkronisering bruker PostgreSQL, Valkey og S3-kompatibel lagring. GitHub Actions bygger, skanner og signerer images som publiseres til GHCR per commit, og en deploy-webhook verifiserer og henter dem. En separat overvåkingsstabel samler logger, metrikker og helsesjekker.](../../../assets/projects/stillas/architecture.svg)

Koden er et monorepo med tre apper og delte pakker for UI, plankomponenter og database. Sanntid i chatten går over
Server-Sent Events som bare sender et signal – klienten henter så ferske data selv, slik at meldingsinnhold aldri går
gjennom strømmen. En egen bakgrunnsjobb synkroniserer stillingsannonser fra Nav, Enhetsregisteret og postnummerregisteret på
faste tidspunkter.

Drift og overvåking ligger i egne repoer. Images bygges i CI, skannes for sårbarheter, signeres og publiseres med commit-SHA
som tagg; deploy skjer ved at en signert webhook verifiserer signaturene og henter images – serveren bygger aldri selv.
Overvåkingen (logger, metrikker og helsesjekker) kjører atskilt fra appen, så den merker det også om appen går ned.

## Sikkerhet og personvern

Sikkerhet og personvern er tenkt inn fra starten, fordi systemet behandler opplysninger om deltakere:

- Ansatte logger inn med passord og tofaktor eller med Microsoft Entra ID; deltakere har en egen innloggingsmodell, med Vipps som alternativ.
- Rollebasert tilgangsstyring, tilgang til hver deltaker basert på avdeling og tildelt veileder, og revisjonslogg over endringer og innsyn.
- Automatisk anonymisering av deltakere etter avsluttet tiltak, og kryptert lagring.
- Hemmeligheter kryptert med SOPS og age, med en skriftlig rutine for rotasjon.
- Forsyningskjeden er strammet inn: GitHub Actions pinnet til commit-SHA, signerte images og automatiske avhengighetsoppdateringer.
- En skriftlig risikovurdering som kombinerer Datatilsynets metode for personvernkonsekvensvurdering og NSMs grunnprinsipper for IKT-sikkerhet.

## Hva jeg lærte

- **Fagkunnskap er en designressurs.** Mange valg kom fra å kjenne oppfølgingssamtalen innenfra – for eksempel at
  deltakeren skal kunne bidra mellom møtene, og at retningen skrives i deltakerens egne ord.
- **Autentisering er et eget fag.** Roterende refresh-tokens med gjenbruksdeteksjon, OIDC med PKCE og øyeblikkelig
  tilbaketrekking av sesjoner lærte meg å la alle ruter være beskyttet som standard – og å teste listen over unntakene.
- **Drift handler om tillit.** Signerte images, deploy etter digest og overvåking som kjører atskilt lærte meg å tenke på hva som
  skjer når noe går galt, ikke bare hvordan det skal virke.
- **Arbeid med AI-assistenter krever struktur.** Prosjektet er utviklet med AI-kodeassistanse, og det fungerte best med
  skriftlige spesifikasjoner, planer og moduldokumentasjon som både jeg og verktøyet kunne holde oss til.
