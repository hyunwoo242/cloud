//server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { BluetoothSerialPort } = require('bluetooth-serial-port');
const readline = require('readline');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const deviceAddress = '98:DA:50:01:CE:BF'; // Arduino Bluetooth 모듈 주소로 교체
const btSerial = new BluetoothSerialPort();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

btSerial.findSerialPortChannel(deviceAddress, (channel) => {
  btSerial.connect(deviceAddress, channel, () => {
    console.log('Bluetooth 연결 성공!');

    rl.on('line', (input) => {
      btSerial.write(Buffer.from(input, 'utf-8'), (err, bytesWritten) => {
        if (err) console.error(err);
        else console.log(`${bytesWritten} 바이트 전송: ${input}`);
      });
    });

    btSerial.on('data', (buffer) => {
      console.log(`수신: ${buffer.toString('utf-8')}`);
    });

    io.on('connection', (socket) => {
      console.log('웹 소켓 연결됨');

      socket.on('control-command', (command) => {
        btSerial.write(Buffer.from(command, 'utf-8'), (err, bytesWritten) => {
          if (err) console.error(err);
          else console.log(`${bytesWritten} 바이트 전송: ${command}`);
        });
      });
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
