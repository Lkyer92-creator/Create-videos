/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Static export: the site is pure HTML/CSS/JS published to the gh-pages
  // branch and served by GitHub Pages (no server, so no API routes).
  output: "export",
  // Project Pages serves the site under /<repo-name>/, so assets must use it.
  basePath: "/Create-videos",
  images: { unoptimized: true },
};
