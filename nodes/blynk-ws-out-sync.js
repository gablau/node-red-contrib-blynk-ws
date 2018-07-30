module.exports = function(RED) {
	"use strict";

	function BlynkOutSyncNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.pinmode = n.pinmode; 
        
		if(this.pinmode == 1) 
			this.connected_label = RED._("blynk-ws-out-sync.status.connected-all");
		else
			this.connected_label = RED._("blynk-ws-out-sync.status.connected-fixed") + this.pin; 
             

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-sync.status.connecting") + n
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
					text: "blynk-ws-out-sync.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-sync.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-out-sync.errors.missing-conf"));
		}
		this.on("input", function(msg) {
			if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
				var pin = node.pin;
				if(node.pinmode == 1) {
					node.blynkClient.syncAll();
				}
				else {
					node.blynkClient.syncVirtual(pin);
				}
				
			}
		});
	}
	
	RED.nodes.registerType("blynk-ws-out-sync", BlynkOutSyncNode);
};