module.exports = {
  server: {
    entry: "server.js",
  },
  rewrites: [
    {
      source: "/api/(.*)",
      destination: "/server.js",
    },
  ],
};
