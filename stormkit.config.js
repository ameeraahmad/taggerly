module.exports = {
  // Specify the server entry point
  server: {
    entry: "server.js",
  },
  // Redirects to handle routing
  redirects: [
    {
      from: "/api/(.*)",
      to: "server.js",
    },
    {
      from: "/ad-details.html",
      to: "server.js",
    },
    {
      from: "/sitemap.xml",
      to: "server.js",
    },
    {
      from: "/robots.txt",
      to: "server.js",
    },
    {
      // Catch-all for other routes to handle SPA-like behavior if needed
      from: "/(.*)",
      to: "index.html",
    }
  ]
};
