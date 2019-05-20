# WebGyroForCemuhook

Use web ondevicemotion event data provided to cemuhook.

## Usage

Download releases [Gyro.exe](https://github.com/hjmmc/WebGyroForCemuhook/releases)

Double click Gyro.exe

Run Cemu.exe and Checked Options->GamePad mation source->DSU1->By Slot

Use your phone's browser (safair or chrome) open http://your.pc.ip:8080 (example http://192.168.1.100:8080)

Load the game and enjoy it~

## Notie in IOS 12.2+

If you are using ios 12.2+, please enable 'Settings > Safari > Motion and Orientation access' and use HTTPS to access.

Since safari's websocket does not support self-signed certificates, when using HTTPS access, socket.io will probably use XHR instead of websocket, which will increase communication latency.

## Test whit PadTest

Download [PadTest_1011.zip](https://files.sshnuke.net/PadTest_1011.zip) form [this page](https://cemuhook.sshnuke.net/padudpserver.html)

## Quote

> [iOSGyroForCemuhook](https://github.com/denismr/iOSGyroForCemuhook)

> [pkg](https://github.com/zeit/pkg)
