module.exports = function(RED) {
	"use strict";

	var blynkUtil = require('./../libs/blynk-util.js');

	function BlynkZergbaNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.nodeType = "zergba";
        
		this.connected_label = RED._("blynk-ws-zergba.status.connected-fixed") + this.pin; 

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.registerInputNode(this);
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-zergba.status.connecting") + n
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
					text: "blynk-ws-zergba.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-zergba.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-zergba.errors.missing-conf"));
		}

		this.on("input", function(msg) {
			if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
				var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
				var pin = node.pin;
				var newmsg = {};

				if (msg.hasOwnProperty("hex")) {
					var hex = Buffer.isBuffer(msg.hex) ? msg.hex : RED.util.ensureString(msg.hex);
					var color = blynkUtil.hexToRgb(hex);
					newmsg.hex = hex;
					newmsg.r = color.r;
					newmsg.g = color.g;
					newmsg.b = color.b;
					newmsg.rgb = color.r+";"+color.g+";"+color.b;
					newmsg.payload = [color.r, color.g, color.b];
					
				}
				else if (msg.hasOwnProperty("r") && msg.hasOwnProperty("g") && msg.hasOwnProperty("b")) {
					var r = Buffer.isBuffer(msg.r) ? msg.r : RED.util.ensureString(msg.r);
					var g = Buffer.isBuffer(msg.g) ? msg.g : RED.util.ensureString(msg.g);
					var b = Buffer.isBuffer(msg.b) ? msg.b : RED.util.ensureString(msg.b);
					newmsg.hex = blynkUtil.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
					newmsg.r = msg.r;
					newmsg.g = msg.g;
					newmsg.b = msg.b;
					newmsg.rgb = msg.r+";"+msg.g+";"+msg.b;
					newmsg.payload = [msg.r, msg.g, msg.b];
				}
				else {
					var tmpcolor = payload.split("\0");
					if(tmpcolor.length == 3){
						newmsg.hex = blynkUtil.rgbToHex(parseInt(tmpcolor[0]), parseInt(tmpcolor[1]), parseInt(tmpcolor[2]));
						var color = blynkUtil.hexToRgb(newmsg.hex);
						newmsg.r = color.r;
						newmsg.g = color.g;
						newmsg.b = color.b;
						newmsg.rgb = color.r+";"+color.g+";"+color.b;
						newmsg.payload = [color.r, color.g, color.b];

					}
					tmpcolor = payload.split(";");
					if(tmpcolor.length ==3){
						newmsg.hex = blynkUtil.rgbToHex(parseInt(tmpcolor[0]), parseInt(tmpcolor[1]), parseInt(tmpcolor[2]));
						var color = blynkUtil.hexToRgb(newmsg.hex);
						newmsg.r = color.r;
						newmsg.g = color.g;
						newmsg.b = color.b;
						newmsg.rgb = color.r+";"+color.g+";"+color.b;
						newmsg.payload = [color.r, color.g, color.b];
					}
					
				}
				//todo valida valori

				this.status({
					fill: "green",
					shape: "dot",
					text: node.connected_label + " ["+newmsg.r+", "+newmsg.g+", "+newmsg.b+"]",
				});

				node.blynkClient.virtualWrite(pin, newmsg.payload);
				this.send(newmsg);
			}
		});

		this.on("close", function() {
			node.blynkClient.removeInputNode(node);
		});
	}
	
	RED.nodes.registerType("blynk-ws-zergba", BlynkZergbaNode);
};