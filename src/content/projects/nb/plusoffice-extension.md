---
title: PlusOffice-utvidelsen
summary: Chrome-utvidelse som forbedrer og automatiserer arbeidsflyten i fagsystemet PlusOffice – med NAV-avstemming, rapporter og en egen release- og oppdateringsløype.
period:
  start: "2025-05"
status: in-use
context: work
areas: [frontend, data, devops]
stack: [TypeScript, React, WXT, Vite, Tailwind CSS, shadcn/ui, Zod, ExcelJS, Paged.js, IndexedDB, Vitest, Playwright, GitHub Actions, Netlify]
featured: true
order: 2
draft: false
---

## Bakgrunn

På jobben bruker vi PlusOffice, et eksternt fagsystem, til å følge opp deltakere i tiltak. Som jobbkonsulent kjenner jeg arbeidsflyten godt – og vet hvor den gnisser: de samme opplysningene registreres både hos NAV og i PlusOffice, rapporter krever mye manuelt arbeid på tvers av skjermbilder og verktøy, og dokumenter skal se ordentlige ut når de skrives ut.

Utvidelsen startet våren 2025 som et lite sidepanel med noen hjelpeverktøy. Den har siden vokst til et internt verktøy for kolleger i Sandnes Pro-Service, med versjonerte releaser og automatiske oppdateringer. Våren 2026 bygde jeg den helt om som versjon 2.0.

## Hva jeg bygde

Utvidelsen legger et sidepanel ved siden av PlusOffice, slik at verktøyene er tilgjengelige uten å forlate fagsystemet:

- **NAV-avstemming:** henter deltakerlister fra NAV, sammenligner dem med registreringene i PlusOffice og viser avvik felt for felt. Herfra kan man opprette eller oppdatere deltakeren i PlusOffice. Avvik sorteres etter hvor viktige de er, og kan ignoreres – de dukker opp igjen hvis noe endrer seg.
- **Rapporter:** resultatrapport for AFT med et manuelt gjennomgangslag for det som krever faglig skjønn (som sluttårsak), og vedlegg til refusjonskrav der månedsverk beregnes etter NAVs regler. Lister og rapporter kan eksporteres til Excel.
- **Statistikk over tid:** et lokalt, anonymisert statistikklager som gjør det mulig å se på perioder lenger tilbake enn PlusOffice selv tar vare på data.
- **Dokumenter:** handlingsplaner med egen utskriftsvisning, tilpassede topp- og bunntekster og marger, og automatisk sikkerhetskopi av skjemadata mens man skriver.
- **Oversikt og kontakter:** en filtrerbar deltakeroversikt, og registrering av eksterne kontakter med oppslag i Enhetsregisteret.

Beregningen bak resultatrapporten fantes først som et eget Python-verktøy. Den er portet til TypeScript og flyttet inn i utvidelsen, slik at hele løpet skjer på ett sted.

## Arkitektur

![Arkitekturskisse: content scripts kjører i PlusOffice- og NAV-sidene og utveksler typede meldinger med en background service worker og et sidepanel i React, som bruker chrome.storage og et anonymisert IndexedDB-lager. Release: GitHub Actions tester og signerer en CRX-pakke, en repository_dispatch får store-repoet til å validere den og åpne en pull request, Netlify publiserer CRX-pakken og update-manifestet, og installerte utvidelser oppdaterer seg selv.](../../../assets/projects/plusoffice-extension/architecture.svg)

Utvidelsen er bygget med WXT og består av isolerte deler som snakker sammen med typede meldinger: et sidepanel i React, en bakgrunnstjeneste som holder tilstand og styrer hentingen, content scripts som leser og fyller ut sidene i PlusOffice, og et lite skript på NAV-siden.

**Releaseløpet** er automatisert. Hver push og pull request til hovedgrenen typesjekkes, testes og bygges i GitHub Actions. En commit merket som release signerer i tillegg utvidelsen som en CRX-pakke, lager en GitHub Release med endringslogg og sender et `repository_dispatch`-varsel til et eget store-repo. Der henter en workflow pakken, sjekker at den er signert med riktig nøkkel og utvidelses-ID, og åpner en pull request med ny pakke og oppdatert update-manifest. Når den merges, publiserer Netlify filene, og Chrome oppdaterer de installerte utvidelsene. Store-repoet har publisert over 50 versjoner.

## Hva jeg lærte

- **Å bygge oppå et system man ikke eier.** PlusOffice kan endre seg når som helst, så skrapingen av sidene er en skjør kontrakt. Jeg lærte å låse den fast med tester mot ekte HTML-utdrag.
- **Å skrive til et annet system krever ydmykhet.** En tidligere versjon sendte hele skjemaet på nytt ved oppdatering, og endret dermed felt ingen hadde rørt. Nå skrives bare endrede felt, testet mot ekte lagringsforespørsler.
- **Personvern i små valg.** Lageret for statistikk har ingen navn, bare en ikke-sensitiv ID, og listen over avvik som er ignorert lagrer verken fødselsnummer eller avviksverdier.
- **Distribusjon er en del av produktet.** Å gi ut en utvidelse utenfor Chrome Web Store lærte meg om signering, update-manifester og hvordan to repoer kan samarbeide gjennom en pull request i stedet for direkte push.
- **En omskriving kan være riktig.** Versjon 2.0 var en full ombygging på WXT, som ga et ryddigere skille mellom delene av utvidelsen. Etterpå fulgte en grundig arkitektur- og kodegjennomgang, bedre CI og over 900 automatiserte tester.
