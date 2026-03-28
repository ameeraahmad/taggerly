module.exports = {
  // Routes to redirect to our server.js function
  rewrites: [
    {
      source: '/api/(.*)',
      destination: '/server.js',
    },
    {
      source: '/sitemap.xml',
      destination: '/server.js',
    },
    {
      source: '/robots.txt',
      destination: '/server.js',
    },
    // For static files (HTML), let Stormkit serve them directly
    // This assumes they are in the root directory and the build output includes them.
  ],
};
