import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/constants.ts', 'src/schemas.ts', 'src/prisma.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  external: ['@prisma/client', 'zod'],
  banner: {
    js: `
/**
 * @nosmarket/shared v0.1.0
 * Gaming Marketplace Shared Package
 */`.trim(),
  },
});
