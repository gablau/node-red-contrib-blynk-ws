module.exports = function(RED) {
	"use strict";

	function BlynkInAppNode(n) {
		RED.nodes.createNode(this, n);
		this.client = n.client;
		var node = this;
		this.blynkClient = RED.nodes.getNode(this.client);

		this.nodeType = "app";

		if (this.blynkClient) {
			this.blynkClient.registerInputNode(this);

			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-in-app.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function() {
				node.status({
					fill: "green",
					shape: "dot",
					text: "blynk-ws-in-app.status.connected"
				});
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-in-app.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-in-app.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-in-app.errors.missing-conf"));
		}

		this.on("close", function() {
			node.blynkClient.removeInputNode(node);
		});
	}

	RED.nodes.registerType("blynk-ws-in-app", BlynkInAppNode);
};