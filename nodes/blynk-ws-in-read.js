module.exports = function(RED) {
	"use strict";

	function BlynkInReadNode(n) {
		RED.nodes.createNode(this, n);
		this.client = n.client;
		var node = this;
		this.blynkClient = RED.nodes.getNode(this.client);
		this.nodeType = "read";
		this.pin = n.pin;
		this.pin_all = n.pin_all;

		if(this.pin_all) 
				this.connected_label = RED._("blynk-ws-in-read.status.connected-all");
		else
				this.connected_label = RED._("blynk-ws-in-read.status.connected-fixed") + this.pin; 

		if (this.blynkClient) {
			this.blynkClient.registerInputNode(this);
			
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-in-read.status.connecting") + n
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
					text: "blynk-ws-in-read.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-in-read.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-in-read.errors.missing-conf"));
		}

		this.on("close", function() {
			node.blynkClient.removeInputNode(node);
		});
	}

	RED.nodes.registerType("blynk-ws-in-read", BlynkInReadNode);
};