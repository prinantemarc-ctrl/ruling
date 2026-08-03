# Ruling.bet

MVP de marché de prédiction (USDC / Polygon) — trading off-chain LMSR, dépôts & retraits on-chain.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (Neon recommandé)
- next-intl (`en` défaut, `fr`)
- wagmi + RainbowKit + SIWE
- Vitest (`lib/lmsr.ts`, `lib/risk.ts`)

## Setup local

```bash
cp .env.example .env
# renseigner DATABASE_URL (Postgres) et les clés wallet
npm install
npx prisma migrate deploy
npm run dev
```

Tests : `npm test`

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + Next build |
| `npm run db:deploy` | Appliquer migrations |
| `npm test` | Tests unitaires LMSR / risk |

## Domaine

Production prévue sur [ruling.bet](https://ruling.bet).
