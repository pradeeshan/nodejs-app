const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Simple API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js API!' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Node.js Web Application running in Docker...!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
