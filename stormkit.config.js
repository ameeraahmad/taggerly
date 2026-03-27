module.exports = {
  server: {
    entry: "server.js",
  },
  redirects: [
    {
      from: "/test",
      to: "/login.html",
    },
    {
      from: "/api/:path*",
      to: "server.js",
    },
    {
      from: "/ad-details.html",
      to: "server.js",
    }
  ]
};
