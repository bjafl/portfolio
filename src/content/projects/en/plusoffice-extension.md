---
title: The PlusOffice extension
summary: A Chrome extension that improves and automates the workflow in the PlusOffice case-management system – with NAV reconciliation, reports and its own release and update pipeline.
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

## Background

At work we use PlusOffice, an external case-management system, to follow up participants in employment programmes. As a job consultant I know the workflow well – and where it chafes: the same information is registered both with NAV (the Norwegian labour and welfare administration) and in PlusOffice, reports take a lot of manual work across screens and tools, and documents need to look right when they are printed.

The extension started in spring 2025 as a small side panel with a few helpers. It has since grown into an internal tool for colleagues at Sandnes Pro-Service, with versioned releases and automatic updates. In spring 2026 I rebuilt it from scratch as version 2.0.

## What I built

A side panel next to PlusOffice keeps the tools at hand without leaving the system:

- **NAV reconciliation:** fetches participant lists from NAV, compares them with the records in PlusOffice and shows differences field by field. From there, participants can be created or updated. Differences are sorted by importance and can be ignored – they reappear if something changes.
- **Reports:** the AFT results report, with a manual review layer for what takes professional judgement (such as end reasons), and the attachment for reimbursement claims, where person-months are calculated by NAV's rules. Lists and reports can be exported to Excel.
- **Statistics over time:** a local, anonymised store covering periods further back than PlusOffice itself keeps data.
- **Documents:** action plans with their own print view, custom headers, footers and margins, and automatic backup of form data while you type.
- **Overview and contacts:** a filterable participant overview, and external contacts with business-register lookup.

The calculation behind the results report first existed as a separate Python tool. It has been ported to TypeScript and moved into the extension, so the whole process happens in one place.

## Architecture

![Architecture sketch: content scripts in the PlusOffice and NAV pages exchange typed messages with a background service worker and a React side panel, backed by chrome.storage and an anonymised IndexedDB store. Release: GitHub Actions tests and signs a CRX, a repository_dispatch makes the store repo validate it and open a pull request, Netlify publishes the CRX and update manifest, and installed extensions update themselves.](../../../assets/projects/plusoffice-extension/architecture.svg)

The extension is built with WXT and consists of isolated parts that talk through typed messages: a React side panel, a background service worker that holds state and orchestrates fetching, content scripts that read and fill in PlusOffice pages, and a small script on the NAV site.

**The release pipeline** is automated. GitHub Actions type-checks, tests and builds every push and pull request to the main branch. A commit marked as a release also signs the extension as a CRX package, creates a GitHub Release with a changelog and sends a `repository_dispatch` event to a separate store repository. There, a workflow fetches the package, checks its signing key and extension ID, and opens a pull request with the new package and update manifest. Once merged, Netlify publishes the files and Chrome updates the installed extensions. The store repository has published over 50 versions.

## What I learned

- **Building on a system you don't own.** PlusOffice can change at any time, so scraping its pages is a fragile contract. I learned to pin it down with tests against real HTML excerpts.
- **Writing to another system calls for humility.** An earlier version re-sent the whole form on update, changing fields nobody had touched. Now only changed fields are written, tested against real save requests.
- **Privacy lives in small choices.** The statistics store holds no names, only a non-sensitive ID, and the list of ignored differences stores neither national ID numbers nor the differing values.
- **Distribution is part of the product.** Shipping an extension outside the Chrome Web Store taught me about signing, update manifests and letting two repositories cooperate through a pull request rather than a direct push.
- **A rewrite can be the right call.** Version 2.0 was a full rebuild on WXT, which gave a cleaner separation between the parts of the extension. It was followed by a thorough architecture and code review, stronger CI and more than 900 automated tests.
