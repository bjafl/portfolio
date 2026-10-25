---
title: e2ee-drop
summary: A self-hosted service for end-to-end encrypted file transfer, rewritten from scratch after a serverless prototype – with accounts, key recovery and permanent links.
period:
  start: "2026-09"
status: active
context: personal
areas: [frontend, backend, devops, security]
stack: [TypeScript, React, Vite, Tailwind CSS, Fastify, PostgreSQL, Prisma, MinIO, tweetnacl, Argon2id, Docker Compose, Vitest]
featured: true
order: 3
repo: https://github.com/bjafl/e2ee-drop
links:
  - label: "Predecessor: e2ee-file-drop"
    href: https://github.com/bjafl/e2ee-file-drop
draft: false
---

## Background

Sensitive files usually travel by e-mail or through a cloud service that can read them. I wanted the recipient to create
a link and the sender to upload, with the file encrypted in the sender's browser before it leaves the machine.

The first attempt, **e2ee-file-drop** (2025), was a serverless prototype: Netlify Functions and Netlify Blobs, storage in
Backblaze B2 through presigned URLs, and encryption with tweetnacl (`nacl.box`) in a Web Worker. It worked, but it was narrow. The whole file is encrypted in memory in a single call, so large files hit the browser's memory
limit. The recipient's private key sat in `localStorage` in one browser with a 24-hour lifetime, so clearing the browser
or switching device meant the file could never be decrypted. And there were no accounts and no tests.

**e2ee-drop** is the rewrite: the same idea, as a service you can run yourself.

## What I built

- **The anonymous flow, as before.** No account needed: the recipient creates a one-time link, and the key pair stays in
  the recipient's browser (`localStorage`, optionally PIN-protected).
- **Accounts with key management.** At registration the browser generates a key pair and wraps the private key
  (`nacl.secretbox`) with a key derived from the password using Argon2id. The server stores only the wrapped key. Login
  does not send the password either, but a separate Argon2id derivation, so the server cannot compute the key that
  unwraps the private key.
- **A recovery code.** A second wrapped copy of the key is locked by a code shown once. With it you can change password
  without losing data; without it the account's links and files must be deleted, and the service says so plainly.
- **Permanent links and an inbox.** Each account has a fixed personal link and can create more, with a contact list,
  visibility (public or contacts only), live status over Server-Sent Events, a storage quota and a retention period per
  link.
- **Verification codewords.** Sender and recipient each derive a short word phrase from the recipient's public key and
  compare it aloud. A wrong or tampered link shows up as a mismatch.
- **Two-factor (TOTP)**, e-mail verification, password reset, Norwegian and English UI, and light/dark mode.

## Architecture

![Architecture sketch: the sender's browser zips and encrypts with nacl.box in a Web Worker, and the recipient's browser decrypts locally. Both go through an nginx web container with /api and /s3 to a Fastify API (presigned URLs and sessions) and MinIO (ciphertext only). The API uses PostgreSQL (links and wrapped keys), and a cleanup job enforces expiry and retention. Plaintext files, private keys and the password itself never leave the browsers.](../../../assets/projects/e2ee-drop/architecture.svg)

The code is a pnpm monorepo: a React app, a Fastify API and shared packages for types, codewords and the database
(Prisma). The whole stack starts with `docker compose up`. The API hands out presigned URLs, so file bytes travel directly between browser and storage and never through API code.

The threat model is narrow and concrete: the server should never see plaintext or private keys. File names, file type and message are encrypted together with the file, so the server does not see them. It does see the remaining metadata – who sends to whom, file size, timing, account e-mail and contacts – and stores the ciphertext. It has not
been audited by anyone else. Anonymous links are bearer links – anyone holding the link
can disrupt the exchange, though the content stays safe – and that is written down as a deliberate choice in the design
spec.

## Tech

React, Vite and Tailwind on the frontend; Fastify, Prisma and PostgreSQL on the backend; MinIO with an S3 API for files.
tweetnacl (`box` = X25519 + XSalsa20-Poly1305, `secretbox`) for encryption, hash-wasm for Argon2id, fflate for zipping
multiple files and otpauth for TOTP. Docker Compose for operations, and more than 60 test files with Vitest across the API,
frontend and shared packages.

## What I learned

- **A prototype shows what is missing.** The limitations I wrote down in the prototype became the requirements list for the
  rewrite, above all for key management: a key that lives in one browser is not a usable product.
- **Key management is harder than the encryption itself.** Keeping the password, the login proof and the wrapping key
  apart, so the server can unlock nothing, took more thought than `nacl.box`.
- **Be honest about what remains.** The rewrite still encrypts each file in memory in one call, and file size is capped
  (500 MB by default, configurable); streaming encryption is the next step, not something I have solved.
- **Spec and plan first.** The repo has design specs and implementation plans, and the project was built
  spec- and plan-driven, with AI assistance.
