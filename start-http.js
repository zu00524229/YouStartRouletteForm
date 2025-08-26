const { exec } = require('child_process');

// 直接呼叫 http-server
const child = exec('npx http-server -p 8080 build/web-mobile');

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`http-server exited with code ${code}`);
});
