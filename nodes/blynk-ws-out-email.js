module.exports = function(RED) {
	"use strict";

	function BlynkOutEmailNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.email = n.email;

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.registerGenericNode(this, 'email');

			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-email.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function(n) {
				node.status({
					fill: "green",
					shape: "dot",
					text: RED._("blynk-ws-out-email.status.connected") + n
				});
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-email.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-email.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-out-email.errors.missing-conf"));
		}
		this.on("input", function(msg) {
			if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
				var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
				var subject = msg.topic ? msg.topic : payload;
				node.blynkClient.sendEmail(node.email, subject, payload);
			}
		});
	}

	RED.nodes.registerType("blynk-ws-out-email", BlynkOutEmailNode);
};