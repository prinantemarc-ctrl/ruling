-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "TradingAccess" AS ENUM ('INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "MarketCurrency" AS ENUM ('REAL', 'PLAY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "balance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "playBalance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "playFaucetClaimedAt" TIMESTAMP(3),
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "txHash" TEXT,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedOutcome" "Outcome",
    "liquidityParam" DECIMAL(36,18) NOT NULL,
    "maxLossAllowed" DECIMAL(18,6) NOT NULL,
    "platformReserveSnapshot" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "spreadMarkup" DECIMAL(18,6) NOT NULL DEFAULT 0.02,
    "currency" "MarketCurrency" NOT NULL DEFAULT 'REAL',
    "tradingAccess" "TradingAccess" NOT NULL DEFAULT 'INTERNAL',
    "qYes" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "qNo" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "outcome" "Outcome" NOT NULL,
    "shares" DECIMAL(36,18) NOT NULL,
    "cost" DECIMAL(18,6) NOT NULL,
    "fairCost" DECIMAL(18,6) NOT NULL,
    "priceAtTrade" DECIMAL(18,8) NOT NULL,
    "platformMargin" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" "Outcome" NOT NULL,
    "sharesOwned" DECIMAL(36,18) NOT NULL DEFAULT 0,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "DepositRequest_txHash_key" ON "DepositRequest"("txHash");

-- CreateIndex
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");

-- CreateIndex
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawRequest_txHash_key" ON "WithdrawRequest"("txHash");

-- CreateIndex
CREATE INDEX "WithdrawRequest_status_idx" ON "WithdrawRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawRequest_userId_idx" ON "WithdrawRequest"("userId");

-- CreateIndex
CREATE INDEX "Market_closesAt_idx" ON "Market"("closesAt");

-- CreateIndex
CREATE INDEX "Market_currency_resolved_idx" ON "Market"("currency", "resolved");

-- CreateIndex
CREATE INDEX "Trade_marketId_createdAt_idx" ON "Trade"("marketId", "createdAt");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE INDEX "Position_userId_idx" ON "Position"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_marketId_outcome_key" ON "Position"("userId", "marketId", "outcome");

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

