module.exports = function(RED) {
	"use strict";

	function BlynkOutBridgeNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.pinmode = n.pinmode; 
		this.pintype = n.pintype;
		this.bpin = n.bpin;
		this.key = n.key; 
        
		if(this.pinmode == 1) 
			this.connected_label = RED._("blynk-ws-out-bridge.status.connected-dynamic");
		else {
			var type = node.pintype.charAt(0).toUpperCase();
			this.connected_label = RED._("blynk-ws-out-bridge.status.connected-fixed") + type + this.pin;
		}
			 
             

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-bridge.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function() {
				node.status({
					fill: "green",
					shape: "dot",
					text: node.connected_label
				});
				node.blynkClient.bridgeSetAuthToken(node.bpin, node.key);
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-bridge.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-bridge.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-out-bridge.errors.missing-conf"));
		}
		this.on("input", function(msg) {
			if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
				var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
				var pin = node.pin;
				if(node.pinmode == 1) {
					if (!msg.hasOwnProperty("pin")) {
						node.warn("Bridge node - Setting \"pin mode\" to \"dynamic\" but no msg.pin found.");
						return;
					}
					if(msg.pin<0 || msg.pin>127) {
						node.warn("Bridge node - The msg.pin must be between 0 and 127.");
						return;
					}
					pin = msg.pin;
				}
				switch (node.pintype) {
					case 'vw':
						node.blynkClient.bridgeVirtualWrite(node.bpin, pin, payload);
						break;
					case 'aw':
						node.blynkClient.bridgeAnalogWrite(node.bpin, pin, payload);
						break;
					case 'dw':
						node.blynkClient.bridgeDigitalWrite(node.bpin, pin, payload);
						break;
				}
				
			}
		});
	}
	
	RED.nodes.registerType("blynk-ws-out-bridge", BlynkOutBridgeNode);
};