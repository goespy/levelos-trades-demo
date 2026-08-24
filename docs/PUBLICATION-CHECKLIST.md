# Publication checklist

## Recommended release path

Publish this working tree as a **new repository with fresh history** named `levelos-trades-demo`. Keep production repositories and source data private.

Do not make the original demo repository public. Its earlier commit retains files and configuration that were intentionally removed from this portfolio edition; deleting them in a later commit does not remove them from Git history.

## Before the first public push

- Export only the current tracked working tree into the new repository.
- Create one clean initial commit after all checks pass.
- Confirm no `.env`, database, runtime upload, private key, credential, or generated share token is tracked.
- Confirm all seeded email addresses use `example.com` and all seeded telephone numbers use reserved `555` ranges.
- Keep `PUBLIC_DEMO=true` in every hosted environment.
- Use an isolated synthetic database and unique demo-only authentication values.
- Leave Resend, Trello, Turso, and Blob credentials unset unless they belong to isolated demo resources.
- Enable GitHub secret scanning, push protection, Dependabot alerts, and private vulnerability reporting.
- Add the repository description and topics: `nextjs`, `typescript`, `prisma`, `operations`, `crm`, `portfolio`.

## Verification gate

Run the following from a clean install:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

Then run the synthetic seed and follow `docs/DEMO-WALKTHROUGH.md` once on desktop and once at a mobile viewport.

## Portfolio framing

Describe the project as a production-derived workflow with a redesigned public interface. Do not imply that the public UI is the exact production interface, that sample pricing is operational pricing, or that the contract and payment simulations are legal or financial services.
