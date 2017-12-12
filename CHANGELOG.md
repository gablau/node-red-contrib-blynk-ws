# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Blynk Protocol - Rewritten send and receive message functions, with more options, like 'Blynk-library-js'
- Heartbeat once 10 seconds
- Max virtual pin allowed 128

[Unreleased]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.3.0...HEAD
[0.3.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.1.0...0.2.0

