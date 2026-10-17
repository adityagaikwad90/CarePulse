// Vercel Serverless Function entry point
// Forwards incoming API requests to the Express backend app
const app = require('../backend/server');

module.exports = app;
