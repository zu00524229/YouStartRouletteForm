const { spawn } = require('child_process');
const os = require('os');

// 啟動 http-server
const child = spawn('npx', ['http-server', '-p', '8080', 'build/web-mobile'], {
  shell: true,
});

// 把 http-server 的輸出轉印到 log
child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`http-server exited with code ${code}`);
});

// 延遲 2 秒後再顯示可分享 IP，避免被刷掉
setTimeout(() => {
  console.log('====================================');
  console.log('👉 請用以下網址連線 (給別人用)：');

  const nets = os.networkInterfaces();
  const validIps = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        validIps.push(net.address);
      }
    }
  }

  if (validIps.length === 0) {
    console.log('⚠️ 沒有找到可用的區網 IP，只能用 http://127.0.0.1:8080 本機存取');
  } else {
    validIps.forEach((ip) => {
      console.log(`   http://${ip}:8080`);
    });

    if (validIps.length > 1) {
      console.log('⚠️ 偵測到多張網卡 (例如 WiFi + 有線)，請確認要給別人哪個 IP');
    }
  }

  console.log('====================================');
}, 2000);
