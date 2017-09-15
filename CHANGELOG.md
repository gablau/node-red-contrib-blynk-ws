# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 0.1.0 - 2017-09-15
### Added
- Implemented SSL usage on the websocket connection.
- Added Other Messages Type and Status Messages
- Debug option in the configuration node
- Display the number of pins on the status of the nodes,
- Node - * Notification * to send push notifications on the smartphone
- Node - * Set Property * to set the property of any widget
- Node - * App Event * for the connection and disconnect event of the app
- Node - * LCD Widgets * to simplify the use of this widget
- On-line documentation of each node
- Send PROFILE command on login

### Changed
- Blynk Protocol - Rewritten send and receive message functions, with more options, like 'Blynk-library-js'
- Heartbeat once 10 seconds
- Max virtual pin allowed 128

[Unreleased]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/v0.1.0...HEAD

