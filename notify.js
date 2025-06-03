
const https = require('https');

const webhookUrl = process.env.DISCORD_WEBHOOK;
const message = process.env.DISCORD_MESSAGE;

const data = JSON.stringify({ content: message });

const url = new URL(webhookUrl);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
