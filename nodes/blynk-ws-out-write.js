module.exports = function(RED) {
	"use strict";

	function BlynkOutWriteNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.pinmode = n.pinmode; 
        
		if(this.pinmode == 1) 
		  this.connected_label = RED._("blynk-ws-out-write.status.connected-dynamic");
		else
      this.connected_label = RED._("blynk-ws-out-write.status.connected-fixed") + this.pin; 
             

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-write.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function() {
				node.status({
					fill: "green",
					shape: "dot",
					text: node.connected_label
				});
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-write.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-write.status.disconnected"
				});
			});
			this.blynkClient.on("disabled", function() {
				node.status({
					fill: "red",
					shape: "dot",
					text: "blynk-ws-out-write.status.disabled"
				});
			});
		} else {
			this.error(RED._("blynk-ws-out-write.errors.missing-conf"));
		}
		this.on("input", function(msg) {

			//no input operation if client not connected or disabled
			if(!node.blynkClient || !node.blynkClient.logged) {
				return; 
			}
				
			if (msg.hasOwnProperty("payload")) {
				var payload = Array.isArray(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
				var pin = node.pin;
				if(node.pinmode == 1) {
					if (!msg.hasOwnProperty("pin")) {
						node.warn("Write node - Setting \"pin mode\" to \"dynamic\" but no msg.pin found.");
						return;
					}
					if(msg.pin<0 || msg.pin>255) {
						node.warn("Write node - The msg.pin must be between 0 and 255.");
						return;
					}
					pin = msg.pin;
				}
				node.blynkClient.virtualWrite(pin, payload);
			}
		});
	}
	
	RED.nodes.registerType("blynk-ws-out-write", BlynkOutWriteNode);
};