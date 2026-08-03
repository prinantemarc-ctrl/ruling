import { Prisma } from "@prisma/client";

export function toNumber(value: Prisma.Decimal | number | string): number {
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(6));
}

export function toShareDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(18));
}

export function truncateAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
