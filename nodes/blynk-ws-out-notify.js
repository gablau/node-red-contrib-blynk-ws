module.exports = function(RED) {
	"use strict";

	function BlynkOutNotifyNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.queue = n.queue;
		this.rate = 1000 * (n.rate > 0 ? n.rate : 1);
		this.buffer = [];
		this.intervalID = -1;
        
		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			//this.log("Register notify node - on client: " + this.blynkClient.name);
			this.blynkClient.registerGenericNode(this, 'notify');
            
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-notify.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function() {
				var queuestr = "";
				if (node.queue) {
					queuestr = " - queue: 0";
				}
				node.status({
					fill: "green",
					shape: "dot",
					text: RED._("blynk-ws-out-notify.status.connected") + queuestr
				});
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-notify.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-notify.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-out-notify.errors.missing-conf"));
		}
		this.on("input", function(msg) {
			node.reportDepth = function() {
				if (!node.busy) {
					node.busy = setTimeout(function() {
						if (node.buffer.length > 0) {
							node.status({ 
								fill:  "green",
								shape: "dot",
								text:  "blynk-ws-out-notify.status.connected-queue" + node.buffer.length,
							});
						} else {
							node.status({
								fill:  "green",
								shape: "dot",
								text:  "blynk-ws-out-notify.status.connected-queue" + "0", 
							});
						}
						node.busy = null;
					},500);
				}
			};
			if (node.queue) {
				node.log("queue");
				if ( node.intervalID !== -1) {
					node.buffer.push(msg);
					node.reportDepth();
				}
				else {
					if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
						var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
						node.blynkClient.sendNotify(payload);
					}
					node.reportDepth();

					node.intervalID = setInterval(function() {
						if (node.buffer.length === 0) {
							clearInterval(node.intervalID);
							node.intervalID = -1;
						}
						if (node.buffer.length > 0) {
							var tempmsg = node.buffer.shift();
							if (tempmsg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
								var payload = Buffer.isBuffer(tempmsg.payload) ? tempmsg.payload : RED.util.ensureString(tempmsg.payload);
								node.blynkClient.sendNotify(payload);
							}
						}
						node.reportDepth();
					},node.rate);
				}               
                
			}
			else if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
				var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
				node.blynkClient.sendNotify(payload);
			}
		});
		this.on("close", function() {
			clearInterval(node.intervalID);
			clearTimeout(node.busy);
			node.buffer = [];
			node.status({});
		});
	}

	RED.nodes.registerType("blynk-ws-out-notify", BlynkOutNotifyNode);
};