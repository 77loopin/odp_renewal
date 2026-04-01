/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.odpcorp.co.kr",
        pathname: "/index/data/item/**",
      },
    ],
  },
};

export default nextConfig;
