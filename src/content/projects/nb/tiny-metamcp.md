---
title: tiny-metamcp
summary: En selvhostet MCP-aggregator som gir AI-assistenter ett innlogget endepunkt til mine egne verktøy, med OAuth 2.1/PKCE og tilgangsstyring per bruker. Pluss gjenbrukbare MCP-servere.
period:
  start: "2026-05"
status: in-use
context: personal
areas: [frontend, backend, devops, ai, security]
stack: [Python, FastAPI, MCP SDK, SQLite, SQLModel, OAuth 2.1, PKCE, React, TypeScript, Vite, Tailwind CSS, Docker Compose, Coolify, uv, pytest]
featured: true
order: 5
repo: https://github.com/bjafl/tiny-metamcp
links:
  - label: MCP-verktøyene (mcp-tools)
    href: https://github.com/bjafl/mcp-tools
draft: false
---

## Bakgrunn

MCP (Model Context Protocol) er en åpen standard for å gi en AI-assistent som Claude tilgang til verktøy og data utenfra,
for eksempel et oppslag mot et API eller en nettside. Hvert verktøy er en liten «MCP-server» assistenten kan kalle.

Jeg ville at assistenten skulle kunne bruke mine egne verktøy, men å koble hver server for seg til hver klient blir fort
rotete, og et åpent endepunkt som gir en AI tilgang til ting er ikke noe jeg vil ha liggende uten ordentlig innlogging.
Løsningen ble en liten aggregator jeg kan drifte selv: **tiny-metamcp**. Den er inspirert av MetaMCP, men laget lettere og
for Coolify. Ved siden av har jeg **mcp-tools**, et eget repo med verktøyene selv.
Den kjører på min egen server og er i daglig bruk som koblingen til AI-assistenten min.

## Hva jeg bygde

**tiny-metamcp** samler flere MCP-servere bak ett endepunkt.

- **Én inngang, mange servere.** Aggregatoren starter og overvåker underservere installert fra PyPI (`uvx`), npm (`npx`)
  eller et git-repo, og kan også koble til eksterne servere over HTTP. Verktøyene eksponeres med servernavn som prefiks
  (`server__verktøy`), så navn ikke kolliderer.
- **Standardbasert innlogging.** Claude kobler seg til med OAuth 2.1: oppdagelse via `.well-known`, dynamisk
  klientregistrering, PKCE (kun S256) og token-utveksling, uten at jeg limer inn noen nøkkel. Klienter uten OAuth, som
  Claude Desktop, bruker et personlig token jeg genererer i admin-panelet. Tokenet lagres kun som hash.
- **Innlogging via GitHub eller Steam.** Begge ligger bak en felles `IdentityProvider`-abstraksjon. Identitetene er
  adskilt til brukeren selv kobler dem sammen fra kontosiden.
- **Tilgangsstyring per bruker.** Admin-rolle, og hver server er enten synlig for alle eller privat for eieren. Det
  håndheves både i verktøylisten, ved kall og i admin-API-et.
- **Admin-panel.** Legg til, rediger, slå av og på og start servere på nytt, se logger live, test verktøy direkte og
  administrer brukere. Serveradministrasjonen finnes også som MCP-verktøy, så jeg kan styre aggregatoren fra selve samtalen.

**mcp-tools** er et uv-monorepo med små MCP-servere som kan kjøres direkte med `uvx --from git+…`: henting av elementer
fra en nettside med CSS-velger, oppskriftsuttrekk, Open Library, Steam Web API og Backblaze B2.

## Arkitektur

![Arkitekturskisse: MCP-klienter som Claude web og desktop kobler seg via en reverse proxy med TLS (Traefik via Coolify) til aggregatoren, bygd med FastAPI og Python MCP SDK. Aggregatoren autentiserer med OAuth 2.1 og PKCE eller personlig token, har tilgangsstyring per bruker, prefikser verktøy som server__tool og har admin-panel og REST API bak GitHub- eller Steam-innlogging. Under ligger underservere startet med uvx, npx eller git, eller eksterne HTTP-servere. mcp-tools er et eget repo med gjenbrukbare servere som kjøres via uvx fra git.](../../../assets/projects/tiny-metamcp/architecture.svg)

Hver underserver kjører som en egen prosess som aggregatoren holder en MCP-klientsesjon mot. Hver har en livssyklus
med start, stopp og omstart, og stderr går til en loggfil per server. Aggregatoren viser både SSE og Streamable HTTP mot
klientene. Tilstand (servere, brukere, tokens) ligger i SQLite. Hele tjenesten pakkes som en Docker Compose-fil og
distribueres via Coolify.

## Teknologi

Python (FastAPI, MCP SDK, SQLModel, aiosqlite) i backend, et React 19-grensesnitt med TypeScript, Vite, Tailwind og
TanStack Router/Query, og `uv` for pakker. Over 190 testfunksjoner med pytest dekker blant annet OAuth-flyten,
tilgangsstyring og håndtering av underprosesser. `ruff` og pre-commit brukes til kvalitetssikring. Repoet inneholder
Claude Code-oppsett samt spesifikasjoner og planer for hver funksjon, så det er utviklet med AI som hjelpemiddel.

## Hva jeg lærte

- **Autentisering er å følge en spesifikasjon.** Å implementere en OAuth-server selv lærte meg hva
  PKCE faktisk beskytter mot, hvorfor koder og sesjoner får kort levetid, og hvorfor jeg bare godtar den sterkeste
  metoden i stedet for å støtte alt.
- **Tilgang må håndheves på alle flater.** Da jeg innførte brukere og private servere, måtte reglene gjelde i REST-API-et,
  i verktøylisten og i MCP-verktøyene for administrasjon. Én glemt vei hadde lekket.
- **Livssyklus for underprosesser er vanskelig.** Jeg tester mot en ekte lokal MCP-server i stedet for en mock, fordi
  feilene gjerne sitter i samspillet mellom asynkrone oppgaver og avbrytelse.
- **Drift er en del av jobben.** Oppgradering krevde å migrere eksisterende data uten at noen må gjøre det for hånd, og
  README forklarer det som må gjøres manuelt.
- **Gjenbruk lønner seg.** Å skille verktøyene ut i mcp-tools gjør at de kan kjøres av hvilken som helst MCP-klient eller
  aggregator, ikke bare min.
