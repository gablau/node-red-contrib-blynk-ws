# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.1] - 2019-04-17
### Fixed
- No automatic reconnect on connection lost

## [0.9.0] - 2019-03-19
### Add
- Node - *Image Gallery* - Implemented "url" and "urls" property [NOTE: url and urls property are supported only in beta app]
- Node - *Set Property* - Implemented "url" and "urls" property [NOTE: url and urls property are supported only in beta app]

### Changed
- Node - *Configuration* - Using tabs for better UI
- All nodes - Increased the limit of the pins to 255 and better validation checks
- Improved heartbeat , send PING command only if necessary.
- Control and blocking of sending too long messages (BLYNK_PROTOCOL_MAX_LENGTH)
- Compatibility with Blynk C++ Library 0.6.1
- LOGIN command changed to int 29 (old int 2)
- Remove unused command and code clean

### Fixed
- Fix TypeError on node-red restart
- Crash on websocket "timeout" error

## [0.8.0] - 2019-01-05
### Added
- Node - *Configuration* - The configuration node can be "enable" or "disable" now, when disabled no connection is start on boot and all linked node show the red dot "disabled" status.
- Node - *Image Gallery* - New node to simplify the use of this new widget (set images urls is not yet implemented in app)
- Node - *Set Property* - Implemented "url, urls, opacity, rotation, scale" property for Image Gallery widget (blynk cloud or local server >= v0.39.4) [NOTE: url and urls property are not yet supported in app]
- Check SLL certificate on connection for blynk cloud

### Changed
- All nodes - Conversion, where necessary, of "isBuffer" checks into "isArray" checks
- All nodes - Avoid input processing on client node disconnected or disabled
- Node - *zeRGBa* - Check if a valid RGB value is passed, otherwise it will generate an alert and the message will be discarded
- Node - *Table* - It will generate an alert on a simple payload without other parameters and the message will be discarded
- Increase heartbeat timeout to 15 seconds - see Blynk Server [Issue #1294](https://github.com/blynkkk/blynk-server/issues/1294)
- Compatibility with Blynk C++ Library 0.5.4

### Fixed
- Node - *Write* - Now it accepts multiple values as input via arrays and forwards them to the server correctly - see [this](https://community.blynk.cc/t/sending-location-data-from-node-red-to-map-widget/27897/7)
- Correct some log messages

## [0.7.1] - 2018-08-04
### Fixed
- Node - *Sync* - Missing "syncAll" commands

## [0.7.0] - 2018-07-30
### Added
- Node - *Styled Button* -  New node to simplify the use of this new button
- Node - *Set Property* - Implemented "onColor, offColor, onBackColor, offBackColor" property for Styled Button widget (blynk cloud or local server >= v0.36.2)
- Node - *Set Property* - Implemented "fraction" property for Slide widget (blynk cloud or local server >= v0.33.3)
- Node - *Table* - Implemented "select, deselect and order" commands

### Changed
- Code refactor - Extract blynk method and variable to files in "libs" directory
- Node - *Notify* - Rate limit increased to 5 msg/s (Blynk C++ Library 0.5.3)

### Fixed
- Node - *zeRGBa* - Check if the widget is configured in merge mode, otherwise it will generate an alert
- Missing log on respond illegal command
- Message ID overflow - see Blynk Library JS [PR #44](https://github.com/vshymanskyy/blynk-library-js/pull/44)
- Show protocol warning in debug panel

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
- Blynk protocol - Handle any number of Blynk commands (virtualWrite(), setProperty(), etc.) in a row see [Blynk C++ Library 0.5.0](https://community.blynk.cc/t/beta-blynk-library-v0-5-0/19841)
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
- Handle REDIRECT command see [iusse #5](https://github.com/gablau/node-red-contrib-blynk-ws/issues/5) and [this](https://community.blynk.cc/t/correct-websocket-address-for-blynk-server/22496) 

### Changed
- Server port configuration and help message see [Blynk C++ Library 0.5.1](https://community.blynk.cc/t/new-blynk-library-v0-5-1-is-released-important-for-local-server-owners/22449)

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

[Unreleased]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.9.1...HEAD
[0.9.1]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.9.0...0.9.1
[0.9.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.8.0...0.9.0
[0.8.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.7.1...0.8.0
[0.7.1]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.7.0...0.7.1
[0.7.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.6.0...0.7.0
[0.6.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.5.2...0.6.0
[0.5.2]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.5.1...0.5.2
[0.5.1]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.5.0...0.5.1
[0.5.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.1.0...0.2.0

