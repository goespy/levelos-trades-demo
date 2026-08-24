# Security and demo boundary

## Supported scope

This repository is a synthetic portfolio demonstration. It must be deployed only with isolated demo infrastructure and must never be connected to a production database, storage, email, Trello board, or authentication credentials.

## Required deployment settings

- Keep `PUBLIC_DEMO=true`.
- Generate a unique `SESSION_SECRET` value in the deployment environment.
- Use a dedicated demo database containing only generated records.
- Do not configure production Resend, Trello, Turso, or Vercel Blob credentials.
- Reset or replace the demo database regularly if public visitors can mutate it.

## Intentional limitations

- Proposal, contract, portal, and payment tokens address fictional records only.
- The payment flow is a state-transition simulator; it does not process payment information.
- Contract content is a sample interface and is not a legal instrument.
- Pricing is illustrative and must not be used for estimating a real project.

## Reporting

If you find a vulnerability in this portfolio edition, open a GitHub security advisory or contact the repository owner privately. Do not include credentials, tokens, or personal information in a public issue.
