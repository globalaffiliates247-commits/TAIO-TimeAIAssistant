const https = require('https');

const DEPLOY_HOOK_URL = 'https://api.render.com/deploy/srv-dbjkioutlv9c73dgjuc0?key=S073DZACakQ';

console.log('📡 Đang gửi tín hiệu kích hoạt Deploy tới Render...');

https.get(DEPLOY_HOOK_URL, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Kích hoạt Render Deploy thành công (HTTP ' + res.statusCode + ')!');
      try {
        const json = JSON.parse(data);
        console.log('Deploy ID / Details:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Phản hồi từ Render:', data);
      }
    } else {
      console.error(`❌ Render deploy thất bại với mã lỗi HTTP ${res.statusCode}:`, data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Lỗi kết nối mạng khi gọi Render deploy hook:', err.message);
});
