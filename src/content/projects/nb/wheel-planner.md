---
title: wheel-planner
summary: Interaktiv årshjul-planlegger – en radial tidslinje der aktiviteter og milepæler dras og justeres direkte på hjulet. React, SVG og en ren geometrimodul, med et lite Express- og SQLite-API.
period:
  start: "2026-09"
status: prototype
context: personal
areas: [frontend, backend]
stack: [React 19, TypeScript, Vite, Zustand, Tailwind CSS, shadcn/ui, Floating UI, SVG, d3-shape, date-fns, "@use-gesture/react", "@dnd-kit", Express 5, SQLite, better-sqlite3, pnpm workspaces, just, Vitest, Testing Library, Supertest]
featured: true
order: 7
repo: https://github.com/bjafl/wheel-planner
draft: false
---

## Bakgrunn

Et årshjul er en radial tidslinje over ett kalenderår: måneder ytterst og aktiviteter som buer på ringer innover. Jeg ville
se hvor langt jeg kom med direkte manipulasjon som hovedgrep – du skal kunne ta tak i en aktivitet på selve hjulet og dra
den, ikke bare fylle ut et skjema.

Designspesifikasjonen i repoet slår uttrykkelig fast direkte manipulasjon foran en tryggere, skjemabasert første versjon,
med en bevisst enkel backend.

## Hva jeg bygde

- **Hjulet.** SVG-rendering av en månedsring, en markør for dagens dato og én ring per kategori. Aktiviteter vises som
  buer og milepæler som punktmarkører.
- **Dra for å redigere.** Flytt en hel aktivitet, dra i håndtakene i hver ende for å endre start eller slutt, eller flytt
  en milepæl. Datoene oppdateres mens du drar og vises i en tooltip.
- **Gjentakende aktiviteter.** Daglig, ukentlig, månedlig eller årlig regel med intervall og valgfri sluttdato, utfoldet til
  forekomster for det valgte året.
- **Banepakking.** Aktiviteter som overlapper i samme ring legges automatisk i hver sin bane.
- **Ringer.** Legg til, fjern og endre rekkefølge på kategoriringer ved å dra dem i en liste i sidepanelet.
- **Sidepanel** med skjema og liste for å opprette, endre og slette aktiviteter og milepæler. Dessuten zoom og panorering
  på lerretet, tomtilstander og feilmeldinger når API-et svikter. Brukergrensesnittet er på norsk.

**Status og begrensninger.** Dette er en fungerende enbrukerprototype, og README-en sier det rett ut: det finnes ikke
noe brukergrensesnitt for å opprette eller velge hjul ennå – appen lager ett hjul per nettleser (for 2026) ved første
oppstart og husker id-en i `localStorage`. Det er ingen innlogging, ingen flerbruker, ingen visning av flere år, ingen
eksport og ingen angre/gjør om. Dette er uttrykkelig utenfor omfanget i designspesifikasjonen.

## Arkitektur

![Arkitekturskisse: et SVG-hjul med zoom, panorering og dra, og et sidepanel med skjema og ringliste, leser fra og skriver til en Zustand-store. Storen pakker baner på nytt og lagrer hver endring til et Express 5 REST-API for hjul, ringer og aktiviteter, som lagrer i SQLite via better-sqlite3. Modulen geometry/ med rene funksjoner for dato↔vinkel, banepakking og gjentakelse brukes av hjulet og storen.](../../../assets/projects/wheel-planner/architecture.svg)

Det viktigste valget er `geometry/`: rene funksjoner uten React eller DOM for dato↔vinkel, banepakking og utfolding av
gjentakelser. Komponentene inneholder bare pekerhåndtering, og all datomatte går gjennom de samme funksjonene. Det
gjør de subtile delene lette å teste isolert. Drag bruker lokal forhåndsvisningstilstand mens du drar, og lagres i storen først
når du slipper. Banene regnes ut på klienten, lagres i databasen og regnes på nytt når en aktivitet endres.

## Teknologi

React 19, TypeScript og Vite, med Zustand for tilstand, Tailwind CSS 4 og shadcn/ui. Hjulet er håndskrevet SVG med
`d3-shape` og `date-fns`; `@use-gesture/react` håndterer drag, zoom og panorering, `@dnd-kit` ringrekkefølgen og
Floating UI tooltips. API-et er Express 5 med `better-sqlite3` og rå SQL. Monorepo med pnpm workspaces og just-oppskrifter.
Det er 58 testtilfeller i 15 filer (Vitest, Testing Library og Supertest) som dekker geometri, store, API og
sentrale komponenter. Selve dra-følelsen testes ikke automatisk i nettleser; spesifikasjonen sier at den verifiseres manuelt.

## Hva jeg lærte

- **Skille geometri fra rendering.** Å holde dato↔vinkel, banepakking og gjentakelse i rene funksjoner var det som gjorde
  resten håndterbart. Feil her er subtile og vanskelige å se visuelt.
- **Datoer er vanskeligere enn de ser ut.** Koden har en egen konverteringsfunksjon fordi `toISOString()` kan flytte en
  dato en dag i tidssoner foran UTC og over sommertidsskifter.
- **Direkte manipulasjon koster.** Lokal tilstand under drag, snapping til hele dager og en gjentakende serie som én rad
  (der drag flytter hele serien) er valg jeg måtte ta for at det skulle føles riktig.
- **Avgrensning er en egenskap.** README-en og spesifikasjonen sier tydelig hva prototypen ikke er.
