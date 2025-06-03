const https = require('https');

const webhookUrl = process.env.DISCORD_WEBHOOK;
const message = process.env.DISCORD_MESSAGE;

if (!webhookUrl || !message) {
  console.error('Missing webhook URL or message.');
  process.exit(1);
}

console.log('Sending message:', message);

const data = JSON.stringify({
  content: String(message)
});

const url = new URL(webhookUrl);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
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
