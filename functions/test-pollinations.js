const https = require('https');

https.get('https://image.pollinations.ai/prompt/test', (res) => {
  console.log('StatusCode:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d.toString().substring(0, 100)));
}).on('error', (e) => {
  console.error(e);
});
