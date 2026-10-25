---
title: e2ee-drop
summary: Selvdrevet tjeneste for ende-til-ende-kryptert filutveksling, skrevet om fra grunnen etter en serverløs prototype – med kontoer, nøkkelgjenoppretting og permanente lenker.
period:
  start: "2026-09"
status: active
context: personal
areas: [frontend, backend, devops, security]
stack: [TypeScript, React, Vite, Tailwind CSS, Fastify, PostgreSQL, Prisma, MinIO, tweetnacl, Argon2id, Docker Compose, Vitest]
featured: true
order: 4
repo: https://github.com/bjafl/e2ee-drop
links:
  - label: Forgjengeren e2ee-file-drop
    href: https://github.com/bjafl/e2ee-file-drop
draft: false
---

## Bakgrunn

Å sende en sensitiv fil til noen går som regel via e-post eller en skytjeneste som kan lese innholdet. Jeg ville ha en
måte der mottakeren lager en lenke, avsenderen laster opp, og filen blir kryptert i avsenderens nettleser før den forlater
maskinen – slik at tjenesten aldri ser innholdet.

Det første forsøket, **e2ee-file-drop** (2025), var en serverløs prototype: Netlify Functions og Netlify Blobs, lagring i
Backblaze B2 via presignerte URL-er, og kryptering med tweetnacl (`nacl.box`) i en Web Worker. Den fungerte, men prototypen
lærte meg hvor smalt den var. Hele filen krypteres i minnet i ett kall, så store filer stoppes av nettleserens minne.
Mottakerens private nøkkel lå i `localStorage` i én nettleser med 24 timers levetid, så å tømme nettleseren eller bytte
enhet betød at filen aldri kunne dekrypteres. Og det var ingen kontoer og ingen tester.

**e2ee-drop** er omskrivingen: samme idé, men som en tjeneste man kan kjøre selv.

## Hva jeg bygde

- **Anonym flyt som før.** Ingen konto kreves: mottakeren lager en engangslenke, og nøkkelparet blir i mottakerens nettleser (`localStorage`, om ønskelig PIN-beskyttet).
- **Kontoer med nøkkelhåndtering.** Ved registrering lager nettleseren et nøkkelpar og pakker den private nøkkelen inn
  (`nacl.secretbox`) med en nøkkel utledet fra passordet med Argon2id. Serveren lagrer bare den innpakkede nøkkelen. Innloggingen
  sender heller ikke selve passordet, men en egen Argon2id-avledning, slik at serveren ikke kan regne ut nøkkelen som pakker
  opp den private nøkkelen.
- **Gjenopprettingskode.** En andre innpakket kopi av nøkkelen låses av en kode som vises én gang. Med koden kan man bytte
  passord uten å miste data; uten den må kontoens lenker og filer slettes, og det sier tjenesten tydelig fra om.
- **Permanente lenker og innboks.** Hver konto har en fast personlig lenke og kan lage flere, med kontaktliste, synlighet
  (åpen eller bare kontakter), live status via Server-Sent Events, lagringskvote og oppbevaringstid per lenke.
- **Kontrollord.** Avsender og mottaker utleder hver for seg et kort ord-sett fra mottakerens offentlige nøkkel og sammenligner
  det muntlig. Det avslører en feil eller forfalsket lenke.
- **Tofaktor (TOTP)**, e-postbekreftelse, passordtilbakestilling, språkvalg (norsk og engelsk) og lys/mørk modus.

## Arkitektur

![Arkitekturskisse: avsenderens nettleser zipper og krypterer med nacl.box i en Web Worker, mottakerens nettleser dekrypterer lokalt. Begge går via en nginx web container med /api og /s3 til et Fastify API (presignerte URL-er og sesjoner) og MinIO (bare chiffertekst). API-et bruker PostgreSQL (lenker og innpakkede nøkler), og en cleanup-jobb håndhever utløp og oppbevaringstid. Klartekstfiler, private nøkler og selve passordet forlater aldri nettleserne.](../../../assets/projects/e2ee-drop/architecture.svg)

Koden er et pnpm-monorepo: en React-app, et Fastify-API og delte pakker for typer, kontrollord og database (Prisma). Hele
stakken starter med `docker compose up` (Postgres, MinIO, migrering, API, en cleanup-jobb og nginx). API-et deler ut
presignerte URL-er, så filbytene går direkte mellom nettleser og lagring og aldri gjennom API-koden.

Trusselmodellen er smal og konkret: serveren skal aldri se klartekst eller private nøkler. Filnavn, filtype og melding ligger krypterte sammen med filen, så serveren ser dem ikke. Den ser derimot øvrig metadata – hvem som sender til hvem, filstørrelse, tidspunkt, e-post og kontakter – og lagrer chifferteksten. Den er ikke
revidert av andre, og jeg gjør ikke krav på mer. Anonyme lenker er «bærerlenker» – den som har lenken kan forstyrre
utvekslingen, selv om innholdet er trygt – og det er skrevet ned som et bevisst valg i designspesifikasjonen.

## Teknologi

React, Vite og Tailwind i frontend; Fastify, Prisma og PostgreSQL i backend; MinIO med S3-API for filer. tweetnacl
(`box` = X25519 + XSalsa20-Poly1305, `secretbox`) til kryptering, hash-wasm til Argon2id, fflate til å zippe flere filer
og otpauth til TOTP. Docker Compose til drift, og over 60 testfiler med Vitest på tvers av API, frontend og delte pakker.

## Hva jeg lærte

- **En prototype viser hva som mangler.** Begrensningene jeg skrev ned i prototypen ble kravlisten til omskrivingen, og
  mest til nøkkelhåndteringen: en nøkkel som bare lever i én nettleser er ikke et brukbart produkt.
- **Nøkkelhåndtering er vanskeligere enn selve krypteringen.** Å holde passord, innloggingsbevis og innpakningsnøkkel
  adskilt, slik at serveren ikke kan låse opp noe, krevde mer tenkning enn `nacl.box`.
- **Vær ærlig om det som gjenstår.** Omskrivingen krypterer fortsatt hver fil i minnet i ett kall, og filstørrelsen er
  begrenset (standard 500 MB, kan endres); strømmende kryptering er neste steg, ikke noe jeg har løst.
- **Spesifikasjon og plan først.** Repoet har designspesifikasjoner og implementasjonsplaner, og prosjektet er
  bygget spesifikasjons- og plandrevet, med AI-assistanse.
