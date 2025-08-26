// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'luckywheel', // 前端靜態檔
      script: 'start-http.js',
      interpreter: 'node',
    },
    {
      name: 'test-signalr', // SignalR 測試伺服器
      script: 'server.js',
      interpreter: 'node',
    },
  ],
};
