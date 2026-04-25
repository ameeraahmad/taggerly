module.exports = {
  rewrites: [
    {
      source: '/api/(.*)',
      destination: '/server.js'
    }
  ]
};
