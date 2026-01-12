/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['lucide-react'],
    distDir: 'dist', // Match legacy Vercel "Output Directory" setting (from Vite)
    output: 'standalone', // Optimization for Vercel
};

export default nextConfig;
