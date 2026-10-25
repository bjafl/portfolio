---
title: Migrating to a new case management system
summary: Changing systems for around 150 employees and 60 AFT participants. I extracted, cleaned and moved what the vendor's conversion missed, and converted every document template.
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
  - Work placements, weekly schedules, next of kin and absence came across, not just the basic information
  - Next of kin were separate contact records in the old system, but two free-text fields in the new one. The script turned them into readable text, even when there were more than two
  - I knew the data and the work, and knew what had to come along
technical:
  - Targeted exports from the old system
  - Cleaning and reshaping in Python and pandas, imported as curated CSV files
  - Batch updates in the browser for what CSV could not cover, with my own login, the app's own CSRF protection and a backup before every change
  - Scripted conversion of every document template from docx to HTML
facts:
  - label: Scope
    value: ~150 employees, ~60 participants
draft: false
---

<p class="part part-service">Part 1 · For the service</p>

## One click is never one click

In 2025 we changed case management systems. The new vendor had converted from the same source system many times before,
and the conversion was sold as «one click». The basic information came across fine. But the data models were different,
and much of what we needed day to day did not come along.

Because I know both the work and the data, I knew what was missing and what it was used for. That made it possible to
fill the gaps in a targeted way, instead of registering everything again by hand. The work was agreed with the
organisation.

### What was missing, and what I did

| Data | The problem | The solution |
| --- | --- | --- |
| Work placements | A different data model, not a simple join between tables | Export, reshaping in pandas and a curated CSV import |
| Next of kin | Separate contact records before, two free-text fields now | A script that formats them as readable text, even with more than two |
| Absence | Not included in the conversion | Extracted from the old system and registered in batches in the browser |
| Weekly schedules | Structured times per day and period before, one text field per weekday now | Place and times merged per day, with period headings and the newest first |
| Tasks | Converted tasks with no one responsible, so nobody saw them | Found the people affected, replaced the tasks with the right task groups and logged exceptions |
| Several programmes per person | One row per programme in the source, one participant in the new system | Grouping per person, with rules for which dates, programme type and counsellor apply |
| Document templates | Word templates, while the new system uses HTML | Scripted conversion of every template from docx to HTML |

---

<p class="part part-technical">Part 2 · Under the hood</p>

## Four steps

The vendor's conversion was the starting point. I enriched it instead of replacing it.

1. **Targeted exports** of what was missing, from the old system.
2. **Cleaning and reshaping** in Python and pandas, from the old data model to the new one.
3. **Curated CSV imports** that enriched the records the vendor had converted.
4. **Batch updates in the browser** for what CSV could not cover, such as absence and work placements.

## Example: next of kin

In the old system, next of kin were separate contact records linked to the person. In the new one there are two
free-text fields. The script merged the records into neatly formatted text, and added any extra next of kin as new lines
in the second field when the source had more than two.

| Before: contact table | After: free-text fields |
| --- | --- |
| Kari Nordmann · mother · 900 00 001 | **Next of kin 1:** Kari Nordmann (mother), tel. 900 00 001 |
| Ola Nordmann · brother · 900 00 002 | **Next of kin 2:** Ola Nordmann (brother), tel. 900 00 002 |
| Per Hansen · guardian · 900 00 003 | (new line in next of kin 2) Per Hansen (guardian), tel. 900 00 003 |

The names and numbers are sample data.

## How I worked

What the CSV import could not cover, I added with scripts run in the browser while logged in. The scripts did the same
as a user clicking through and filling in forms in the web app, only automated:

- My own login and my own access rights, agreed with the organisation.
- The same forms as in the user interface, with the app's own CSRF protection.
- A backup of the existing values before every change, so everything could be rolled back.
- A log of what succeeded and what failed, with a manual check of the exceptions.

## What I learned

- **A data model is an interpretation.** Two systems can describe the same reality in completely different ways.
- **Know the data.** Knowing what the data is used for decides what has to come along.
- **Enrich, don't replace.** Build on what works, and fill the gaps where they are.
