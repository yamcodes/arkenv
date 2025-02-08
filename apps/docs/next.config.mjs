import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  /**
   * Enable static exports.
   *
   * @see https://nextjs.org/docs/app/building-your-application/deploying/static-exports
   */
    output: 'export',  
    /**
    * Set base path. This is the slug of your GitHub repository.
    *
    * @see https://nextjs.org/docs/app/api-reference/next-config-js/basePath
   */
  basePath: '/ark.env',
  /**
   * Disable server-based image optimization. Next.js does not support
   * dynamic features with static exports.
   *
   * @see https://nextjs.org/docs/app/api-reference/components/image#unoptimized
   */
   images: {
    unoptimized: true,
  },
};

export default withMDX(config);
