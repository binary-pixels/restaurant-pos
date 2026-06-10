import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pos/shared"],
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "@prisma/client"],
  },
};

export default withNextIntl(nextConfig);
