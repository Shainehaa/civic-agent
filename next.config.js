/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" bundles only the files Next.js actually needs to run in
  // production into a single self-contained folder. Without this, Docker
  // would have to copy your ENTIRE node_modules into the container, which
  // is much slower to build and creates a much larger image.
  output: "standalone",
};

module.exports = nextConfig;
