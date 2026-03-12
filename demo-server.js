const http = require('http');
const fs = require('fs');
const path = require('path');
http.createServer((req, res) => {
  const f = path.join(__dirname, 'demo.html');
  res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(f).pipe(res);
}).listen(8888, () => console.log('Demo: http://localhost:8888'));
