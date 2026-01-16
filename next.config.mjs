import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config = {
  reactStrictMode: true,
  transpilePackages: ['fumadocs-ui', 'fumadocs-core'],
  async rewrites() {
    return [
      {
        source: '/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
    ];
  },
};

export default withMDX(config);
