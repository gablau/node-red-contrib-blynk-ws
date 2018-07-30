module.exports = function(RED) {
	"use strict";

	function BlynkStyleBtnNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.prop = n.prop;
		this.onlabel = n.onlabel;
		this.offlabel = n.offlabel;
		this.oncolor = n.oncolor;
		this.onbackcolor = n.onbackcolor;
		this.offcolor = n.offcolor;
		this.offbackcolor = n.offbackcolor;
		this.nodeType = "style-btn";
        
		this.connected_label = RED._("blynk-ws-style-btn.status.connected-fixed") + this.pin; 

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.registerInputNode(this);
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-style-btn.status.connecting") + n
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
					text: "blynk-ws-style-btn.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-style-btn.status.disconnected"
				});
			});
		} else {
			this.error(RED._("blynk-ws-style-btn.errors.missing-conf"));
		}

		this.on("input", function(msg) {
			if (msg.hasOwnProperty("payload") && msg.hasOwnProperty("topic") && node.blynkClient && node.blynkClient.logged) {
				var payload = msg.payload; //dont check if is a string
				var topic = msg.topic;

				//virtualwrite to node
				if (topic != 'write-property' ) {
					payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
					node.blynkClient.virtualWrite(node.pin, payload);
					return;
				}

				//set property to node
				var prop = node.prop;
				var pin = node.pin;
			
				if (msg.hasOwnProperty("prop") && node.blynkClient && node.blynkClient.logged) {
					prop = Buffer.isBuffer(msg.prop) ? msg.prop : RED.util.ensureString(msg.prop);
				}
				if(prop!=="1"){ //fixed multiple property 
					if(prop == ""){
						node.warn(RED._("blynk-ws-style-btn.warn.bycode"));
						return;
					}

					var msgkey = undefined;
					if(node.blynkClient.multi_cmd) {
						msgkey = node.blynkClient.startMsgMulti();
					} 

					node.blynkClient.setProperty(pin, "onLabel", this.onlabel, msgkey);
					node.blynkClient.setProperty(pin, "offLabel", this.offlabel, msgkey);
					node.blynkClient.setProperty(pin, "onColor", this.oncolor, msgkey);
					node.blynkClient.setProperty(pin, "offColor", this.offcolor, msgkey);
					node.blynkClient.setProperty(pin, "onBackColor", this.onbackcolor, msgkey);
					node.blynkClient.setProperty(pin, "offBackColor", this.offbackcolor, msgkey);

					if(node.blynkClient.multi_cmd) {
						node.blynkClient.sendMsgMulti(msgkey);
					} 
				}
				else { //multiple property by code
					var msgkey = undefined;
					if(node.blynkClient.multi_cmd) {
						msgkey = node.blynkClient.startMsgMulti();
					} 

					//buttons and styled buttons label
					if ((msg.hasOwnProperty("onlabel") || msg.hasOwnProperty("offlabel")) && node.blynkClient && node.blynkClient.logged) {
						if (msg.hasOwnProperty("onlabel")) {
							var onlabel = Buffer.isBuffer(msg.onlabel) ? msg.onlabel : RED.util.ensureString(msg.onlabel);
							node.blynkClient.setProperty(pin, "onLabel", onlabel, msgkey);
						}
						if (msg.hasOwnProperty("offlabel")) {
							var offlabel = Buffer.isBuffer(msg.offlabel) ? msg.offlabel : RED.util.ensureString(msg.offlabel);
							node.blynkClient.setProperty(pin, "offLabel", offlabel, msgkey);
						}
					}
					//styled buttons color (need server v0.36.2)
					if ((msg.hasOwnProperty("onColor") || msg.hasOwnProperty("offColor") || 
						 msg.hasOwnProperty("onBackColor") || msg.hasOwnProperty("offBackColor"))
						 && node.blynkClient && node.blynkClient.logged) {
						if (msg.hasOwnProperty("onColor")) {
							var onColor = Buffer.isBuffer(msg.onColor) ? msg.onColor : RED.util.ensureString(msg.onColor);
							node.blynkClient.setProperty(pin, "onColor", onColor, msgkey);
						}
						if (msg.hasOwnProperty("offColor")) {
							var offColor = Buffer.isBuffer(msg.offColor) ? msg.offColor : RED.util.ensureString(msg.offColor);
							node.blynkClient.setProperty(pin, "offColor", offColor, msgkey);
						}
						if (msg.hasOwnProperty("onBackColor")) {
							var onBackColor = Buffer.isBuffer(msg.onBackColor) ? msg.onBackColor : RED.util.ensureString(msg.onBackColor);
							node.blynkClient.setProperty(pin, "onBackColor", onBackColor, msgkey);
						}
						if (msg.hasOwnProperty("offBackColor")) {
							var offBackColor = Buffer.isBuffer(msg.offBackColor) ? msg.offBackColor : RED.util.ensureString(msg.offBackColor);
							node.blynkClient.setProperty(pin, "offBackColor", offBackColor, msgkey);
						}
					}
				
					if(node.blynkClient.multi_cmd) {
						node.blynkClient.sendMsgMulti(msgkey);
					} 

				}
			}
		});

		this.on("close", function() {
			node.blynkClient.removeInputNode(node);
		});
	}
	
	RED.nodes.registerType("blynk-ws-style-btn", BlynkStyleBtnNode);
};