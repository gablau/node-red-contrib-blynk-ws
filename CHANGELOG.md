# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2018-05-07
### Added
- Node - *zeRGBa* -  New node to simplify the use of this widget in merge mode

## [0.5.2] - 2018-04-27
### Fixed
- Fix Crash on log Read Event

## [0.5.1] - 2018-04-15
### Fixed
- Fix regular expression for validate server url on configuration node
- Fix display readme

## [0.5.0] - 2018-04-14
### Added
- Blynk protocol - Handle any number of Blynk commands (virtualWrite(), setProperty(), etc.) in a row see [Blynk Library 0.5.0](https://community.blynk.cc/t/beta-blynk-library-v0-5-0/19841)
- Control max lenght of message and max number of commands in a single message 
- Config node - Option to enable "Multiple blynk command in single message"  (blynk cloud or local server >= v0.34.0) 
- Config node - Implemented server proxy configuration
- Config node - Option to log protocol "sync" and "bridge" messages type
- Node - *Bridge* - New node that implements the functionality of sending commands to other blynk devices.
- Node - *Sync* - New node that implements the "syncAll" and "syncVirtual" blynk commands
- Node - *Set Property* - Implemented "step" for Step Widget  (blynk cloud or local server >= v0.32.2)
- Node - *Set Property* - Implemented "url" for Video Straming Widget (blynk cloud or local server >= v0.28.7)
- Node - *Set Property* / *LCD* / *Table* - Send multiple blynk command in a single message
- Node - *Read Event* - Option to receive all pins events
- Node - *Write Event* - Option to receive all pins events
- Node - *Write Event* - Added pin number that generate event in msg.pin variable
- Initial support to [Internationalisation](https://nodered.org/docs/creating-nodes/i18n)

### Changed
- Better handle of configuration node error, now blocks child nodes if some parameter is missing.
- More check on "pin" parameter before send message
- The PING command is only sent if no data has been sent or received in the "heart beat" time
- Hide "Auth token" - from all log message
- Config node - Rename "Private key" to "Auth token" and better help message
- Split every node on single file
- Removed dependency from "DataView" package
- Code clean

### Fixed
- Rightly handles the reception of the BRIDGE type commands.
- Websocket SSL connection error on nodejs > 8.6.0 see ([ws iusse #1227](https://github.com/websockets/ws/issues/1227))

## [0.4.0] - 2018-03-09
### Added
- Handle CONNECT_REDIRECT command see [iusse #5](https://github.com/gablau/node-red-contrib-blynk-ws/issues/5) and [this](https://community.blynk.cc/t/correct-websocket-address-for-blynk-server/22496) 

### Changed
- Server port configuration and help message see [Blynk Library 0.5.1](https://community.blynk.cc/t/new-blynk-library-v0-5-1-is-released-important-for-local-server-owners/22449)

### Fixed
- Invalid HW cmd: "pm" see [iusse #3](https://github.com/gablau/node-red-contrib-blynk-ws/issues/3)
- Protocol Log on message received and retrive right command body

## [0.3.0] - 2017-12-12
### Added
- Node - *Notify* - Implemented queue messages 
- Node - *Write* - Pin mode (Fixed / Dynamic) pass pin number in msg.pin variable
- Node - *Set Property* - Pin mode (Fixed / Dynamic) pass pin number in msg.pin variable

### Changed
- Node - *LCD* - Warning on incorrect use of msg.payload property
- Fixed some log messages

## [0.2.0] - 2017-09-18
### Added
- Debug option to log only specified pins number
- Node - * Table Widgets * to simplify the use of this widget
- Link to official documentation

### Fixed
- Missing logs on read and write event

## 0.1.0 - 2017-09-15
### Added
- Implemented SSL usage on the websocket connection.
- Added Other Messages Type and Status Messages
- Debug option in the configuration node
- Display the number of pins on the status of the nodes,
- Node - * Notify * to send push notifications on the smartphone
- Node - * Set Property * to set the property of any widget
- Node - * App Event * for the connection and disconnect event of the app
- Node - * LCD Widgets * to simplify the use of this widget
- On-line documentation of each node
- Send PROFILE command on login

### Changed
- Blynk Protocol - Rewritten send and receive message functions, with more options, like [vshymanskyy/blynk-library-js](https://github.com/vshymanskyy/blynk-library-js)
- Heartbeat once 10 seconds
- Max virtual pin allowed 128

[Unreleased]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.6.0...HEAD
[0.6.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.5.2...0.6.0
[0.5.1]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.5.1...0.5.2
[0.5.1]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.5.0...0.5.1
[0.5.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.1.0...0.2.0

