---
title: Nettlesertillegg for fagsystemet
summary: Chrome-tillegg som dekker hull i fagsystemet vi bruker til deltakeroppfølging – dokumenter som blir fine på papir, oppgaver som ikke glipper, og resultatrapporter vi kan etterprøve.
period:
  start: "2025-05"
status: in-use
context: work
areas: [frontend, data, devops]
stack: [TypeScript, React, WXT, Vite, Tailwind CSS, shadcn/ui, Zod, Paged.js, ExcelJS, IndexedDB, Vitest, Playwright, GitHub Actions, Netlify, Intune]
featured: true
order: 1
related: [fagsystem-migrering, stillas]
service:
  - Brukes daglig av AFT-teamet og flere til, rundt 14 personer
  - Rundt 40 kolleger lager dokumenter med utskriftsvisningen
  - Gjør AFT-resultatrapporteringen mulig, med tall som kan etterprøves
  - Første versjon på en måned, ved siden av jobben som jobbkonsulent
technical:
  - Paginering i sanntid med topp- og bunntekst, først egenutviklet, senere Paged.js
  - Typede meldinger mellom sidepanel, bakgrunn og content scripts
  - Signerte releaser, 50+ versjoner, med automatisk oppdatering
  - Egen plugin-store på Netlify, rullet ut til alle PC-ene med Intune
facts:
  - label: Brukere
    value: ~40, av dem ~14 daglig
draft: false
---

<p class="part part-service">Del 1 · For tjenesten</p>

## Hullene i hverdagen

Fagsystemet vi bruker til å følge opp deltakere har en dokumenteditor i nettleseren, men ingen forhåndsvisning – bare en
knapp for eksport til PDF. Malen vi fikk hadde elementene vi ba om, men resultatet så ut som en utskrift av en nettside,
med automatiske metadata vi ikke ville ha. For å få et dokument til å se greit ut ble det mange runder med eksport,
justering og ny eksport.

Resultatrapporteringen for AFT var et annet hull: den innebygde rapporten lot seg ikke etterprøve eller justere, og
tallene stemte ikke helt. Den var ikke god nok til at vi kunne bruke den. I tillegg registreres de samme opplysningene
både hos Nav og i fagsystemet, og oppgaver som nærmer seg frist er lette å overse.

Tillegget er ikke laget sammen med leverandøren. Det legger seg ved siden av fagsystemet og fyller hullene, slik at
kollegene kan fortsette å jobbe der de allerede er. Det startet våren 2025 som et lite sidepanel, og første versjon tok
rundt en måned ved siden av jobben som jobbkonsulent. Våren 2026 bygde jeg det helt om som versjon 2.0.

### Hvem bruker hva

| Funksjon | Hvem | Hva det gir |
| --- | --- | --- |
| Utskriftsvisning | Alle, rundt 40 | Dokumenter som ser ut som gode fysiske dokumenter, justert før eksport |
| Oppgaveliste med utheving | Alle | Oppgaver som nærmer seg frist blir filtrert fram og synlige |
| Daglig arbeid i sidepanelet | AFT-teamet (11) og 2 til | Mindre tid og frustrasjon i dokumentarbeidet |
| Resultatrapporter for AFT | Meg og 1–2 til | Rapporteringen er mulig, med tall som kan spores og justeres |

### Mer i sidepanelet

- **Nav-avstemming:** henter deltakerlister fra Nav, sammenligner dem med registreringene i fagsystemet og viser avvik
  felt for felt. Herfra kan man opprette eller oppdatere deltakeren. Avvik sorteres etter hvor viktige de er, og kan
  ignoreres – de dukker opp igjen hvis noe endrer seg.
- **Rapporter:** resultatrapport for AFT med et manuelt gjennomgangslag for det som krever faglig skjønn (som
  sluttårsak), og vedlegg til refusjonskrav der månedsverk beregnes etter Navs regler. Lister og rapporter kan eksporteres
  til Excel.
- **Statistikk over tid:** et lokalt, anonymisert statistikklager som gjør det mulig å se på perioder lenger tilbake enn
  fagsystemet selv tar vare på data.
- **Oversikt og kontakter:** en filtrerbar deltakeroversikt, og registrering av eksterne kontakter med oppslag i
  Enhetsregisteret.

---

<p class="part part-technical">Del 2 · Under panseret</p>

## Paginering i sanntid

Kjernen i utskriftsvisningen er paginering i HTML. Den deler innholdet fra editoren på sider mens du skriver, med riktig
sideoppsett og redigerbar topp- og bunntekst. Det var mer avansert å få til enn jeg trodde:

- Ingen enslige ord eller linjer øverst på en ny side.
- Tabeller som ser like ryddige ut på papir som i editoren.
- Siden beregnes på nytt i sanntid, så avstand og justeringer kan gjøres før eksport.

Den første versjonen var helt egenutviklet, og var i daglig bruk i rundt et år. Da jeg reviderte den, gikk jeg over til
Paged.js. Med egen erfaring fra problemet visste jeg hva biblioteket måtte løse, og hva som fortsatt måtte tilpasses
våre dokumenter.

## Arkitektur og releaser

![Arkitekturskisse: content scripts kjører i sidene til fagsystemet og Nav og utveksler typede meldinger med en background service worker og et sidepanel i React, som bruker chrome.storage og et anonymisert IndexedDB-lager. Release: GitHub Actions tester og signerer en CRX-pakke, en repository_dispatch får store-repoet til å validere den og åpne en pull request, Netlify publiserer CRX-pakken og update-manifestet, og installerte tillegg oppdaterer seg selv.](../../../assets/projects/fagsystem-tillegg/architecture.svg)

Tillegget er bygget med WXT og består av isolerte deler som snakker sammen med typede meldinger: et sidepanel i React,
en bakgrunnstjeneste som holder tilstand og styrer hentingen, content scripts som leser og fyller ut sidene i
fagsystemet, og et lite skript på Nav-siden.

**Releaseløpet** er automatisert. Hver push og pull request til hovedgrenen typesjekkes, testes og bygges i GitHub
Actions. En commit merket som release signerer i tillegg tillegget som en CRX-pakke, lager en GitHub Release med
endringslogg og sender et `repository_dispatch`-varsel til et eget store-repo. Der henter en workflow pakken, sjekker at
den er signert med riktig nøkkel og utvidelses-ID, og åpner en pull request med ny pakke og oppdatert update-manifest.
Over 50 versjoner er publisert på den måten.

**Distribusjonen** satte jeg også opp selv: en egen plugin-store på en statisk webserver (Netlify), og en Intune-policy
som ruller tillegget automatisk ut til alle PC-ene i bedriften. Ingen trenger å installere noe.

Beregningen bak resultatrapporten fantes først som et eget Python-verktøy. Den er portet til TypeScript og flyttet inn i
tillegget, med et manuelt gjennomgangslag for det som krever faglig skjønn.

## Hva jeg lærte

- **Bygg selv, og vit når du skal bytte.** Egen paginering lærte meg problemet. Det gjorde valget av bibliotek senere
  enkelt.
- **Små hull, stor effekt.** Den mest brukte funksjonen løser en irritasjon alle hadde vent seg til.
- **Å bygge oppå et system man ikke eier.** Fagsystemet kan endre seg når som helst, så skrapingen av sidene er en skjør
  kontrakt. Jeg lærte å låse den fast med tester mot ekte HTML-utdrag.
- **Å skrive til et annet system krever ydmykhet.** En tidligere versjon sendte hele skjemaet på nytt ved oppdatering, og
  endret felt ingen hadde rørt. Nå skrives bare endrede felt, testet mot ekte lagringsforespørsler.
- **Releaser skal være kjedelige.** Når kolleger er avhengige av verktøyet, må oppdateringer gå av seg selv. Versjon 2.0
  ble fulgt av en grundig gjennomgang av arkitektur og kode, strammere CI og over 900 automatiske tester.
