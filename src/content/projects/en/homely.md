---
title: homely
summary: A home-automation hobby turned into a tidy open-source integration – a Home Assistant custom component for the Homely alarm with push updates and a fallback, plus unofficial API documentation.
period:
  start: "2025-10"
status: active
context: personal
areas: [backend]
stack: [Python, Home Assistant, Socket.IO, pydantic, asyncio, OpenAPI 3, Swagger UI, GitHub Actions, pytest, mypy, ruff, pre-commit, Docker Compose]
featured: true
order: 4
repo: https://github.com/bjafl/homely-ha
links:
  - label: Unofficial API documentation
    href: https://bjafl.github.io/homely-api-docs/
  - label: API documentation (repo)
    href: https://github.com/bjafl/homely-api-docs
draft: false
---

## Background

I run Home Assistant at home, and my Homely alarm was one of the things that would not join in. Homely offers an SDK API
for customers, but its documentation is incomplete: some endpoints are described, while the WebSocket events and many of
the data fields you have to work out yourself. The solutions others had built were MQTT-based.

So I made it a proper project: an integration that behaves like a built-in part of Home Assistant, and a separate repo
that documents the API the way it actually behaves, so others do not have to guess.

## What I built

**homely-ha** is a Home Assistant custom component (installed through HACS as a custom repository).

- **Real-time first.** One Socket.IO connection per location delivers instant changes from sensors and the alarm. If the
  connection drops, the integration retries with exponential backoff (30 seconds up to 5 minutes, at most six attempts).
- **REST as the fallback.** The REST API fetches the full state at startup and takes over when push is not working. The
  polling interval follows connection health: 30 minutes when every location has live push, 30 seconds with none.
- **Polite to the API.** If Homely answers that I have called too often, the integration pauses calls for at least two
  minutes and serves the last known state meanwhile. Expired credentials trigger Home Assistant's standard re-authentication flow.
- **Multiple locations** from one Home Assistant install, chosen in the setup dialog and changed later under "Configure".
- **Entities:** motion, door/window, flood, smoke, tamper and battery as binary sensors; alarm state, temperature, signal
  strength and power/energy as sensors; and a button for manual refresh. Norwegian and English translations.

**homely-api-docs** is an unofficial OpenAPI 3.0.3 specification of the same API: the five REST endpoints, the
`device-state-changed` and `alarm-state-changed` events, data models and practical pitfalls (the WebSocket is Socket.IO
rather than a raw WebSocket, the token in the URL needs the right encoding, and the API is read-only). The spec is
validated and linted in GitHub Actions and published as Swagger UI on GitHub Pages. The README says openly that the
content was compiled from Homely's PDF documentation and community projects, refined with help from Claude, and may
contain mistakes.

## Architecture

![Architecture sketch: the Homely cloud API is reached through a REST client (full state, fallback, token refresh) and a Socket.IO client per location (reconnect with backoff). Both feed a DataUpdateCoordinator with a typed state model (pydantic), events merged in, polling from 30 seconds to 30 minutes and a pause on rate limits. Home Assistant entities – binary sensors, sensors and a refresh button – read from the coordinator. homely-api-docs is a separate OpenAPI specification of the same API.](../../../assets/projects/homely/architecture.svg)

The coordinator is the glue. It keeps each location's state in a pydantic model, accepts both REST responses and push
events, and notifies the entities when something changes. Unknown event types are captured as their own type instead of
breaking the connection.

## Tech

Python 3.13 with asyncio, Home Assistant's `DataUpdateCoordinator` and config flow, `python-socketio` for real-time and
pydantic for the models. Quality tooling: ruff, mypy, codespell and pre-commit hooks, CI on GitHub Actions, and around
185 tests with pytest and Home Assistant's test tooling. The repo also has a docker compose file that starts a Home
Assistant instance for manual testing. The README states 85% test coverage.

## What I learned

- **Reliability is mostly failure paths.** Showing a sensor value is the easy part. The time went into what happens when
  the connection drops, the token expires or the API says stop – and still showing the user a correct state.
- **Documentation is part of the product.** Writing the API down as it behaves, with OpenAPI and CI validation, forced me
  to understand it better than the code alone did, and makes it useful to people other than me.
- **Following a platform's conventions.** Config flow, re-authentication, translations and Home Assistant's quality
  requirements gave me a frame to build against. The project follows a quality tier (Bronze) that I assessed myself; it is not an official approval.
- **Honest status.** The integration is read-only (no arming/disarming) and cloud-dependent, and the README says so. It
  was developed with Claude Code as a tool, which the repo states openly.
