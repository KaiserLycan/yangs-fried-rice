/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Update this once the Supabase project is created —
        // used for menu item images stored in Supabase Storage.
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
