const express = require('express');
const app = express();

// 指定 public/signalr 作為公開資源路徑
const path = require('path');
// app.use('/signalr', express.static(path.join(__dirname, 'public/signalr')));
app.use('/signalr', (req, res, next) => {
    console.log("📦 請求資源:", req.url);
    next();
}, express.static(path.join(__dirname, 'public/signalr')));


const PORT = 5001;
app.listen(PORT, () => {
    console.log(`✅ SignalR 靜態 JS Server 啟動於：http://localhost:${PORT}/signalr/`);
});
