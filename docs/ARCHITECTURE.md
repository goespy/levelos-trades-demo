# Architecture

## Application shape

The application uses a single Next.js codebase with three surfaces:

- **Operations:** clients, designs, estimating, proposals, contracts, jobs, accounting, and reporting.
- **Field:** a mobile-focused view for phase progress and job context.
- **Customer:** tokenized proposal, prep, contract, job, invoice, and review routes.

Prisma provides the data model and query layer. SQLite makes the local demonstration self-contained; the adapter can use an isolated libSQL database in a hosted demo.

## Data boundaries

Authenticated operations routes can access the full synthetic record. Public token routes select only the fields needed by the relevant customer experience. They do not return internal cost line items, margins, unrelated clients, or authentication data.

`PUBLIC_DEMO=true` is a fail-safe switch. External email, Trello synchronization, and remote file uploads must remain disabled in a public portfolio deployment.

## Core lifecycle

```text
Client
  ├─ DesignProject ─ ClientFile / RenderJob
  ├─ PoolBuild ─ BuildLineItem
  └─ Proposal ─ Contract
                    └─ Job ─ JobPhase / Invoice / JobCostEntry
                                      └─ Review / Referral / MaintenancePlan
```

## Deliberate design choices

- Estimating remains deterministic and inspectable rather than AI-generated.
- Demo records are regenerated from code so walkthroughs are repeatable.
- Customer links use random identifiers and customer-safe API projections.
- The portfolio UI can differ from the private operational UI without misrepresenting the underlying workflow.
- Live integrations are adapters at the edge of the system, not requirements for the domain model.
