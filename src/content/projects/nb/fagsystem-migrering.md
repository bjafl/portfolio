---
title: Migrering til nytt fagsystem
summary: Bytte av fagsystem for rundt 150 ansatte og 60 AFT-deltakere. Jeg hentet ut, renset og overførte det leverandørens konvertering ikke fikk med, og konverterte alle dokumentmalene.
period:
  start: "2025"
  end: "2025"
status: archived
context: work
areas: [data]
stack: [Python, pandas, CSV, JavaScript, Fetch API, DOMParser, FormData, docx → HTML]
featured: true
order: 3
related: [fagsystem-tillegg, stillas]
service:
  - Arbeidspraksiser, ukeplaner, pårørende og fravær kom med, ikke bare grunninformasjon
  - Pårørende var egne kontaktoppføringer i det gamle systemet, men to fritekstfelt i det nye. Skriptet gjorde dem om til lesbar tekst, også når det fantes flere enn to
  - Jeg kjente dataene og arbeidet, og visste hva som måtte med
technical:
  - Målrettede eksporter fra det gamle systemet
  - Rensing og omforming i Python og pandas, inn som kuraterte CSV-importer
  - Batch-oppdateringer i nettleseren for det CSV ikke dekket, med egen innlogging, appens egen CSRF-beskyttelse og sikkerhetskopi før hver endring
  - Skriptbasert konvertering av alle dokumentmalene fra docx til HTML
facts:
  - label: Omfang
    value: ~150 ansatte, ~60 deltakere
draft: false
---

<p class="part part-service">Del 1 · For tjenesten</p>

## Ett klikk er aldri ett klikk

I 2025 byttet vi fagsystem. Den nye leverandøren hadde gjort konverteringen fra det samme kildesystemet mange ganger før,
og konverteringen ble solgt som «ett klikk». Grunninformasjonen kom greit over. Men datamodellene var ulike, og mye av det
vi trengte i hverdagen kom ikke med.

Fordi jeg kjenner både arbeidet og dataene, visste jeg hva som manglet og hva det skulle brukes til. Det gjorde det mulig
å fylle hullene målrettet, i stedet for å registrere alt på nytt for hånd. Arbeidet var avklart med virksomheten.

### Hva som manglet, og hva jeg gjorde

| Data | Problemet | Løsningen |
| --- | --- | --- |
| Arbeidspraksiser | Annen datamodell, ikke en enkel kobling mellom tabeller | Eksport, omforming i pandas og kuratert CSV-import |
| Pårørende | Egne kontaktoppføringer før, to fritekstfelt nå | Skript som formaterer til lesbar tekst, også ved flere enn to |
| Fravær | Ikke med i konverteringen | Uttrekk fra gammelt system og batch-registrering i nettleseren |
| Ukeplaner | Strukturerte tider per dag og periode før, ett tekstfelt per ukedag nå | Sted og tider slått sammen per dag, med periodeoverskrifter og nyeste først |
| Oppgaver | Konverterte oppgaver uten ansvarlig, så ingen fikk dem opp | Fant de berørte, erstattet oppgavene med riktige oppgavegrupper og logget unntak |
| Flere tiltak per person | Én rad per tiltak i kilden, én deltaker i det nye systemet | Gruppering per person og regler for hvilke datoer, tiltakstype og veileder som gjelder |
| Dokumentmaler | Word-maler, mens det nye systemet bruker HTML | Skriptbasert konvertering av alle malene fra docx til HTML |

---

<p class="part part-technical">Del 2 · Under panseret</p>

## Fire steg

Leverandørens konvertering var utgangspunktet. Jeg beriket den i stedet for å erstatte den.

1. **Målrettede eksporter** av det som manglet, fra det gamle systemet.
2. **Rensing og omforming** i Python og pandas, fra gammel til ny datamodell.
3. **Kuraterte CSV-importer** som beriket oppføringene leverandøren hadde konvertert.
4. **Batch-oppdateringer i nettleseren** for det CSV ikke dekket, som fravær og arbeidspraksiser.

## Eksempel: pårørende

I det gamle systemet var pårørende egne kontaktoppføringer koblet til personen. I det nye er det to fritekstfelt.
Skriptet slo sammen oppføringene til pent formatert tekst, og la ekstra pårørende inn som nye linjer i det andre feltet
når kildedataene hadde flere enn to.

| Før: kontakt-tabell | Etter: fritekstfelt |
| --- | --- |
| Kari Nordmann · mor · 900 00 001 | **Pårørende 1:** Kari Nordmann (mor), tlf. 900 00 001 |
| Ola Nordmann · bror · 900 00 002 | **Pårørende 2:** Ola Nordmann (bror), tlf. 900 00 002 |
| Per Hansen · verge · 900 00 003 | (ny linje i pårørende 2) Per Hansen (verge), tlf. 900 00 003 |

Navnene og numrene er eksempeldata.

## Slik jobbet jeg

Det CSV-importen ikke dekket, la jeg inn med skript kjørt i nettleseren mens jeg var innlogget. Skriptene gjorde det samme
som en bruker gjør ved å klikke og fylle ut skjemaer i webappen, bare automatisert:

- Egen innlogging og egne tilganger, avklart med virksomheten.
- De samme skjemaene som i brukergrensesnittet, med appens egen CSRF-beskyttelse.
- Sikkerhetskopi av eksisterende verdier før hver endring, slik at alt kunne rulles tilbake.
- Logg over hva som lyktes og hva som feilet, med manuell kontroll av unntakene.

## Hva jeg lærte

- **En datamodell er en tolkning.** To systemer kan beskrive samme virkelighet helt ulikt.
- **Kjenn dataene.** Å vite hva dataene brukes til avgjør hva som må med.
- **Berik, ikke erstatt.** Bygg videre på det som fungerer, og fyll hullene målrettet.
