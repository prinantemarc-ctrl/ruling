import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Stub optional Coinbase x402 peers pulled by wagmi connectors.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/evm": false,
      "@x402/evm/upto/client": false,
      "@x402/evm/exact/client": false,
      "@x402/svm/exact/client": false,
      "@x402/core/client": false,
      "@x402/core": false,
      "@x402/svm": false,
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
