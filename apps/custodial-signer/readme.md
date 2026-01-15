# Futureverse custodial signer

Futureverse custodial singer is a NextJS application that is used to sign transactions for users using FV custodial wallets.

## Local development

Run `pnpm exec nx run custodial-signer:serve`

## Deployment

FV custodial signer is hosted on vercel with 4 deployments. We use branch based deployment where commits pushed to following branches will trigger a new deployment.

1. https://signer.futureverse.app (production): deployed from `production` branch.
2. https://signer.futureverse.cloud (staging): deployed from `staging` branch.
3. https://signer.futureverse.red (neptune): deployed from `neptune` branch.
4. https://signer.futureverse.dev (dev): deployed from any feature branch, will require to update the Vercel domain configuration to deploy from specific feature branch.
5. https://signer.futureverse.audit (audit): deployed from any feature branch, will require to update the Vercel domain configuration to deploy from specific feature branch.
