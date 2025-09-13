// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com", // supaya bisa load dari data dummy contoh
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com", // tambahkan ini supaya placeholder bisa load
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
