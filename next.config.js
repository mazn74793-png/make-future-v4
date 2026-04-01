/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ],
  },
  // مش محتاجين نزود الـ body size لأن الرفع بيحصل مباشرة لـ R2
};
module.exports = nextConfig;
