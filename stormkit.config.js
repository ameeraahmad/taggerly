module.exports = {
  server: {
    entry: "server.js",
  },
  redirects: [
    {
      from: "/api/(.*)",
      to: "/server.js",
    },
    {
      from: "/ad-details.html",
      to: "/server.js",
    },
    {
      from: "/sitemap.xml",
      to: "/server.js",
    },
    {
      from: "/robots.txt",
      to: "/server.js",
    }
  ]
};
