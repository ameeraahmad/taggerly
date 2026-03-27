module.exports = {
  server: {
    entry: "server.js",
  },
  redirects: [
    {
      from: "/api/(.*)",
      to: "server.js",
      method: "rewrite",
    },
    {
      from: "/ad-details.html",
      to: "server.js",
      method: "rewrite",
    },
    {
      from: "/sitemap.xml",
      to: "server.js",
      method: "rewrite",
    },
    {
      from: "/robots.txt",
      to: "server.js",
      method: "rewrite",
    }
  ]

};
