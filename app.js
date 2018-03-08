require('babel-polyfill');
const WebSocket = require('ws');
const dgram = require('dgram');
const crc = require('crc');
const long = require('long');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = dgram.createSocket('udp4');

function char(a) {
  return a.charCodeAt(0);
}

const maxProtocolVer = 1001;
const MessageType = {
  DSUC_VersionReq: 0x100000,
  DSUS_VersionRsp: 0x100000,
  DSUC_ListPorts: 0x100001,
  DSUS_PortInfo: 0x100001,
  DSUC_PadDataReq: 0x100002,
  DSUS_PadDataRsp: 0x100002
}
const serverID = 0 + Math.floor(Math.random() * 9007199254740992);
console.log(`serverID: ${serverID}`);

var connectedClient = null;
var lastRequestAt = 0;
var phoneIsConnected = false;
var packetCounter = 0;
const clientTimeoutLimit = 5000;

///////////////////////////////////////////////////

function BeginPacket(data,dlen) {
  let index = 0;
  data[index++] = char('D');
  data[index++] = char('S');
  data[index++] = char('U');
  data[index++] = char('S');

  data.writeUInt16LE(maxProtocolVer, index, true);
  index += 2;

  data.writeUInt16LE(dlen||data.length-16, index, true);
  index += 2;

  data.writeUInt32LE(0, index, true);
  index += 4;

  data.writeUInt32LE(serverID, index, true);
  index += 4;

  return index;
}

function FinishPacket(data) {
  data.writeUInt32LE(crc.crc32(data), 8, true);
}

function SendPacket(client, data) {
  let buffer = new Buffer(16);
  let index = BeginPacket(buffer,data.length);
  // buffer.fill(data,index);
  buffer=Buffer.concat([buffer,data])
  FinishPacket(buffer);
  server.send(buffer,0,buffer.length, client.port, client.address, (error, bytes) => {
    if (error) {
      console.log("Send packet error");
      console.log(error.message);
    }
    else if (bytes !== buffer.length) {
        console.log(`failed to completely send all of buffer. Sent: ${bytes}. Buffer length: ${buffer.length}`);
    }
  });
}


///////////////////////////////////////////////////

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('listening', () => {
  const address = server.address();
  console.log(`UDP Pad motion data provider listening ${address.address}:${address.port}`);
});

server.on('message', (data, rinfo) => {
  if (!(data[0] === char('D') && data[1] === char('S') && data[2] === char('U') && data[3] === char('C'))) return;
  let index = 4;

  let protocolVer = data.readUInt16LE(index); index += 2;

  let packetSize = data.readUInt16LE(index); index += 2;

  let receivedCrc = data.readUInt32LE(index);
  data[index++] = 0; data[index++] = 0;
  data[index++] = 0; data[index++] = 0;

  let computedCrc = crc.crc32(data);

  // if (receivedCrc !== computedCrc)

  let clientId = data.readUInt32LE(index); index += 4;
  let msgType = data.readUInt32LE(index); index += 4;

  if (msgType == MessageType.DSUC_VersionReq) {
    console.log("Version request ignored.");
  } else if (msgType ==  MessageType.DSUC_ListPorts) {
    // console.log("List ports request.");
    let numOfPadRequests = data.readInt32LE(index); index += 4;
    for (let i = 0; i < numOfPadRequests; i++) {
      let requestIndex = data[index + i];
      if (requestIndex !== 0) continue;
      let outBuffer = new Buffer(16);
      outBuffer.writeUInt32LE(MessageType.DSUS_PortInfo, 0, true);
      let outIndex = 4;
      outBuffer[outIndex++] = 0x00; // pad id
      // outBuffer[outIndex++] = phoneIsActive ? 0x02 : 00; // state (connected or disconnected)
      outBuffer[outIndex++] = 0x02; // state (connected)
      outBuffer[outIndex++] = 0x03; // model (generic)
      outBuffer[outIndex++] = 0x01; // connection type (usb)
      // mac address
      for (let j = 0; j < 5; j++) {
        outBuffer[outIndex++] = 0;
      } outBuffer[outIndex++] = 0xFF; // 00:00:00:00:00:FF
      // outBuffer[outIndex++] = 0x00; // battery (none)
      outBuffer[outIndex++] = 0xEF; // battery (charged)
      outBuffer[outIndex++] = 0; // dunno (probably "is active")
      SendPacket(rinfo, outBuffer);
    }
  } else if (msgType == MessageType.DSUC_PadDataReq) {
    let flags = data[index++];
    let idToRRegister = data[index++];
    let macToRegister = ['', '', '', '', '', ''];
    for (let i = 0; i < macToRegister.length; i++ , index++) {
      macToRegister[i] = `${data[index] < 15 ? '0' : ''}${data[index].toString(16)}`;
    }
    macToRegister = macToRegister.join(':');
    
    // console.log(`Pad data request (${flags}, ${idToRRegister}, ${macToRegister})`);

    // There is only one controller, so
    if (flags == 0 || (idToRRegister == 0 && flags & 0x01 !== 0) || (macToRegister == '00:00:00:00:00:ff' && flags & 0x02 !== 0)) {
      connectedClient = rinfo;
      lastRequestAt = Date.now();
    }
  }
});

function Report(motionTimestamp, accelerometer, gyro) {
  let client = connectedClient;
  if (client === null || Date.now() - lastRequestAt > clientTimeoutLimit) return;

  let outBuffer = new Buffer(100);
  let outIndex = BeginPacket(outBuffer);
  outBuffer.writeUInt32LE(MessageType.DSUS_PadDataRsp, outIndex, true);
  outIndex += 4;

  outBuffer[outIndex++] = 0x00; // pad id
  outBuffer[outIndex++] = 0x02; // state (connected)
  outBuffer[outIndex++] = 0x02; // model (generic)
  outBuffer[outIndex++] = 0x01; // connection type (usb)

  // mac address
  for (let i = 0; i < 5; i++) {
      outBuffer[outIndex++] = 0x00;
  } outBuffer[outIndex++] = 0xFF; // 00:00:00:00:00:FF

  outBuffer[outIndex++] = 0xEF; // battery (charged)
  outBuffer[outIndex++] = 0x01; // is active (true)

  outBuffer.writeUInt32LE(packetCounter++, outIndex, true);
  outIndex += 4;

  outBuffer[outIndex]   = 0x00; // left, down, right, up, options, R3, L3, share
  outBuffer[++outIndex] = 0x00; // square, cross, circle, triangle, r1, l1, r2, l2
  outBuffer[++outIndex] = 0x00; // PS
  outBuffer[++outIndex] = 0x00; // Touch

  outBuffer[++outIndex] = 0x00; // position left x
  outBuffer[++outIndex] = 0x00; // position left y
  outBuffer[++outIndex] = 0x00; // position right x
  outBuffer[++outIndex] = 0x00; // position right y

  outBuffer[++outIndex] = 0x00; // dpad left
  outBuffer[++outIndex] = 0x00; // dpad down
  outBuffer[++outIndex] = 0x00; // dpad right
  outBuffer[++outIndex] = 0x00; // dpad up

  outBuffer[++outIndex] = 0x00; // square
  outBuffer[++outIndex] = 0x00; // cross
  outBuffer[++outIndex] = 0x00; // circle
  outBuffer[++outIndex] = 0x00; // triange

  outBuffer[++outIndex] = 0x00; // r1
  outBuffer[++outIndex] = 0x00; // l1

  outBuffer[++outIndex] = 0x00; // r2
  outBuffer[++outIndex] = 0x00; // l2

  outIndex++;

  outBuffer[outIndex++] = 0x00; // track pad first is active (false)
  outBuffer[outIndex++] = 0x00; // track pad first id
  outBuffer.writeUInt16LE(0x0000, outIndex, true); // trackpad first x
  outIndex += 2;
  outBuffer.writeUInt16LE(0x0000, outIndex, true); // trackpad first y
  outIndex += 2;

  outBuffer[outIndex++] = 0x00; // track pad second is active (false)
  outBuffer[outIndex++] = 0x00; // track pad second id
  outBuffer.writeUInt16LE(0x0000, outIndex, true); // trackpad second x
  outIndex += 2;
  outBuffer.writeUInt16LE(0x0000, outIndex, true); // trackpad second y
  outIndex += 2;

  outBuffer.writeUInt32LE(motionTimestamp.low, outIndex, true);
  outIndex += 4;
  outBuffer.writeUInt32LE(motionTimestamp.high, outIndex, true);
  outIndex += 4;

  outBuffer.writeFloatLE(accelerometer.x, outIndex, true);
  outIndex += 4;
  outBuffer.writeFloatLE(accelerometer.y, outIndex, true);
  outIndex += 4;
  outBuffer.writeFloatLE(accelerometer.z, outIndex, true);
  outIndex += 4;

  outBuffer.writeFloatLE(gyro.x, outIndex, true);
  outIndex += 4;
  outBuffer.writeFloatLE(gyro.y, outIndex, true);
  outIndex += 4;
  outBuffer.writeFloatLE(gyro.z, outIndex, true);
  outIndex += 4;

  FinishPacket(outBuffer);
  server.send(outBuffer,0,outBuffer.length, client.port, client.address, (error, bytes) => {
    if (error) {
      console.log("Send packet error");
      console.log(error.message);
    }
    else if (bytes !== outBuffer.length) {
      console.log(`failed to completely send all of buffer. Sent: ${bytes}. Buffer length: ${outBuffer.length}`);
    }
  });
}

server.bind(26760);

/////////////////////////////////////////////////

const wss = new WebSocket.Server({ port: 1337 });

wss.on('connection', function connection(ws) {
  console.log("WS Connected");
  phoneIsConnected = true;
  ws.on('message', function incoming(message) {
    // console.log(message);
    data = JSON.parse(message);
    Report(long.fromNumber(data.ts, true), {x:0,y:0,z:0}, data.gyro);
  });
  ws.on( "error", () => {
    phoneIsConnected = false;
    console.log("WS ERROR");
  });
  ws.on( "close", () => {
    phoneIsConnected = false;
    console.log("WS Disconnected");
  });
});

/////////////////////////////////////////////////

http.createServer(function(request, response) {
  var filePath = path.join(__dirname, 'static.html');
  var stat = fs.statSync(filePath);

  response.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': stat.size
  });

  var readStream = fs.createReadStream(filePath);
  readStream.pipe(response);
}).listen(8080,function(){
  console.log(`
    ----------------------------------------
        打包版本1.3 by 期待的愿望2013
    -----------------------------------------

##使用方法

1.打开你 cemu 所在目录下方的 cemuhook.ini，在里面，把 [Input] 以及下方的内容替换成如下
[Input] 
motionSource = DSU1 
motionSourceIsBtnSource = false 
serverIP = 127.0.0.1 
serverPort = 26760

2.手机连接WiFi，在自带浏览器上打开以下其中网址。`)
  var interfaces=require('os').networkInterfaces()
  for(var k in interfaces){
    for(var i in interfaces[k]){
      if(interfaces[k][i].family=='IPv4'&&interfaces[k][i].address!='127.0.0.1'){
        console.log('http://'+interfaces[k][i].address+':8080')
      }
    }
  }
});