const path = require('path');
// Load server env variables explicitly (Netlify function runs from project root context)
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });

const serverless = require('serverless-http');
const app = require('../../server/server');

// Wrap the Express app as a Netlify serverless function
module.exports.handler = serverless(app);
