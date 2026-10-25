---
title: homely
summary: Hjemmeautomatisering som ble en ryddig åpen kildekode-integrasjon – Home Assistant-tilleggskomponent for Homely-alarmen, med push-oppdateringer og reserveløsning, pluss uoffisiell API-dokumentasjon.
period:
  start: "2025-10"
status: active
context: personal
areas: [backend]
stack: [Python, Home Assistant, Socket.IO, pydantic, asyncio, OpenAPI 3, Swagger UI, GitHub Actions, pytest, mypy, ruff, pre-commit, Docker Compose]
featured: true
order: 6
repo: https://github.com/bjafl/homely-ha
links:
  - label: Uoffisiell API-dokumentasjon
    href: https://bjafl.github.io/homely-api-docs/
  - label: API-dokumentasjon (repo)
    href: https://github.com/bjafl/homely-api-docs
draft: false
---

## Bakgrunn

Jeg bruker Home Assistant hjemme, og Homely-alarmen min var en av tingene som ikke ville være med. Homely tilbyr et
SDK-API for kunder, men dokumentasjonen er mangelfull: noen endepunkter er beskrevet, mens hendelsene over WebSocket og
mange av datafeltene må man finne ut av selv. Det som fantes av løsninger fra andre var MQTT-baserte.

Så jeg gjorde det til et ordentlig prosjekt: en integrasjon som oppfører seg som en innebygd del av Home Assistant, og et
eget repo som dokumenterer API-et slik det faktisk oppfører seg, slik at andre slipper å gjette.

## Hva jeg bygde

**homely-ha** er en tilleggskomponent for Home Assistant (installeres via HACS som eget depot).

- **Sanntid først.** Én Socket.IO-tilkobling per lokasjon gir øyeblikkelige endringer fra sensorer og alarm. Faller
  tilkoblingen ut, prøver integrasjonen igjen med eksponentiell backoff (30 sekunder opp til 5 minutter, maks seks forsøk).
- **REST som reserve.** REST-API-et henter full tilstand ved oppstart og brukes som reserve når push ikke virker.
  Pollingintervallet justeres etter tilkoblingens tilstand: 30 minutter når alle lokasjoner har aktiv push, 30 sekunder uten.
- **Snill mot API-et.** Svarer Homely med at jeg har kalt for ofte, pauser integrasjonen kall i minst to minutter og
  bruker sist kjente tilstand i mellomtiden. Utløpt innlogging gir Home Assistants vanlige reautentiseringsflyt.
- **Flere lokasjoner** fra én Home Assistant-installasjon, valgt i oppsettsdialogen og endret senere under «Konfigurer».
- **Entiteter:** bevegelse, dør/vindu, flom, røyk, sabotasje og batteri som binærsensorer; alarmtilstand, temperatur,
  signalstyrke og strøm/energi som sensorer; og en knapp for manuell oppdatering. Norsk og engelsk oversettelse.

**homely-api-docs** er en uoffisiell OpenAPI 3.0.3-spesifikasjon for det samme API-et: de fem REST-endepunktene,
hendelsene `device-state-changed` og `alarm-state-changed`, datamodeller og praktiske fallgruver (for eksempel at
WebSocket-en er Socket.IO og ikke rå WebSocket, at tokenet i URL-en må kodes riktig, og at API-et er skrivebeskyttet).
Spesifikasjonen valideres og lintes i GitHub Actions og publiseres som Swagger UI på GitHub Pages. READMEen sier åpent at
innholdet er satt sammen fra Homelys PDF-dokumentasjon og fellesskapsprosjekter, bearbeidet med hjelp av Claude, og at
det kan inneholde feil.

## Arkitektur

![Arkitekturskisse: Homely cloud API nås via en REST-klient (full tilstand, reserve, tokenfornyelse) og en Socket.IO-klient per lokasjon (reconnect med backoff). Begge mater en DataUpdateCoordinator med typet tilstandsmodell (pydantic), hendelser flettet inn, polling fra 30 sekunder til 30 minutter og pause ved rate-limit. Home Assistant-entiteter – binærsensorer, sensorer og en oppdateringsknapp – leser fra koordinatoren. homely-api-docs er en egen OpenAPI-spesifikasjon av samme API.](../../../assets/projects/homely/architecture.svg)

Koordinatoren er limet i integrasjonen. Den holder tilstanden for hver lokasjon i en pydantic-modell, tar imot både
REST-svar og push-hendelser og varsler entitetene når noe endrer seg. Ukjente hendelsestyper fanges som egen type i stedet
for å velte tilkoblingen.

## Teknologi

Python 3.13 med asyncio, Home Assistants `DataUpdateCoordinator` og config flow, `python-socketio` for sanntid og pydantic
for modellene. Kvalitetssikring: ruff, mypy, codespell og pre-commit-hooks, CI på GitHub Actions, og rundt 185 tester med
pytest og Home Assistants testverktøy. Repoet har også en docker compose-fil som starter en Home Assistant-instans for
manuell testing. README oppgir 85 % testdekning.

## Hva jeg lærte

- **Pålitelighet er mest feilveier.** Den enkle delen er å vise en sensorverdi. Det som tok tid var hva som skjer når
  tilkoblingen faller, tokenet utløper eller API-et sier stopp – og at brukeren likevel ser en riktig tilstand.
- **Dokumentasjon er en del av produktet.** Å skrive ned API-et slik det oppfører seg, med OpenAPI og CI-validering,
  tvang meg til å forstå det bedre enn koden alene gjorde, og gjør det nyttig for andre enn meg.
- **Å følge en plattforms konvensjoner.** Config flow, reautentisering, oversettelser og kvalitetskrav fra Home Assistant
  ga en ramme å bygge mot. Den følger et kvalitetsnivå (Bronze) jeg selv har vurdert, ikke en offisiell godkjenning.
- **Ærlig status.** Integrasjonen er skrivebeskyttet (ingen armering/avarmering) og avhengig av skyen. Det står i README.
  Den er utviklet med Claude Code som hjelpemiddel, noe repoet sier åpent.
