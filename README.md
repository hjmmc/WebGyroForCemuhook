# WebGyroForCemuhook

Use web ondevicemotion event data provided to cemuhook.

## Usage

Download releases [Gyro.exe](https://github.com/hjmmc/WebGyroForCemuhook/releases)

Double click Gyro.exe

Run Cemu.exe and Checked Options->GamePad mation source->DSU1->By Slot

Use your phone's browser (safair or chrome) open https://your-pc-ip-ip.xip.lhjmmc.cn:8443 (example https://192-168-1-100.xip.lhjmmc.cn:8443)

Load the game and enjoy it~

## Notice

### 1. Notice in iOS 12.2

If you are using ios 12.2+, please enable 'Settings > Safari > Motion and Orientation access' and use HTTPS to access.

### 2. Notice in iOS 13+

If you are using ios 13+, please use HTTPS for access, make sure the url is https://[you-pc-ip-ip].xip.lhjmmc.cn:8443 and the certificate is trusted (hostname must be *.xip.lhjmmc.cn), and click the allow button to grant page permissions. If permissions is not grant, please restart the browser and try again.

### 3. Notice in iOS 13.4

Please upgrade to IOS 13.5+. See [#14](https://github.com/hjmmc/WebGyroForCemuhook/issues/14)

## Test whit PadTest

Download [PadTest_1011.zip](https://files.sshnuke.net/PadTest_1011.zip) form [this page](https://cemuhook.sshnuke.net/padudpserver.html)

## Quote

> [iOSGyroForCemuhook](https://github.com/denismr/iOSGyroForCemuhook)

> [pkg](https://github.com/zeit/pkg)

> [xip.lhjmmc.cn](https://xip.lhjmmc.cn) https cert to slove latency problem. ~~Since safari's websocket does not support self-signed certificates, when using HTTPS access, socket.io will probably use XHR instead of websocket, which will increase communication latency.~~

## Donate

> If you find this project useful, you can buy author a glass of juice 🍹

<details>
  <summary>Paypal & Alipay & Wechat</summary>
  <a alt="Paypal" href="https://www.paypal.com/paypalme/hjmmc"><img src="https://cdn.lhjmmc.cn/paypal.png" width="250px" /></a>  
  <img src="https://cdn.lhjmmc.cn/alipay.jpg" width="300px"  />
  <img src="https://cdn.lhjmmc.cn/wx.jpg" width="350px" />
</details>
