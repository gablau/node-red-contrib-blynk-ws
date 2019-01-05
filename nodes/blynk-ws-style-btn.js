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
			this.blynkClient.on("disabled", function() {
				node.status({
					fill: "red",
					shape: "dot",
					text: "blynk-ws-style-btn.status.disabled"
				});
			});
		} else {
			this.error(RED._("blynk-ws-style-btn.errors.missing-conf"));
		}

		this.on("input", function(msg) {

			//no input operation if client not connected or disabled
			if(!node.blynkClient || !node.blynkClient.logged) {
				return; 
			}
				
			if (msg.hasOwnProperty("payload") && msg.hasOwnProperty("topic")) {
				var topic = RED.util.ensureString(msg.topic);

				//virtualwrite to node
				if (topic != 'write-property' ) {
					var payload = RED.util.ensureString(msg.payload);
					if(payload === "true")  payload = "1";
					if(payload === "false") payload = "0";

					node.blynkClient.virtualWrite(node.pin, payload);
					return;
				}

				//set property to node
				var prop = node.prop;
				var pin = node.pin;
			
				if (msg.hasOwnProperty("prop")) {
					prop = RED.util.ensureString(msg.prop);
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
					if (msg.hasOwnProperty("onlabel") || msg.hasOwnProperty("offlabel")) {
						if (msg.hasOwnProperty("onlabel")) {
							node.blynkClient.setProperty(pin, "onLabel", RED.util.ensureString(msg.onlabel), msgkey);
						}
						if (msg.hasOwnProperty("offlabel")) {
							node.blynkClient.setProperty(pin, "offLabel", RED.util.ensureString(msg.offlabel), msgkey);
						}
					}
					//styled buttons color (need server v0.36.2)
					if (msg.hasOwnProperty("onColor") || msg.hasOwnProperty("offColor") || 
						 msg.hasOwnProperty("onBackColor") || msg.hasOwnProperty("offBackColor")) {
						if (msg.hasOwnProperty("onColor")) {
							node.blynkClient.setProperty(pin, "onColor", RED.util.ensureString(msg.onColor), msgkey);
						}
						if (msg.hasOwnProperty("offColor")) {
							node.blynkClient.setProperty(pin, "offColor", RED.util.ensureString(msg.offColor), msgkey);
						}
						if (msg.hasOwnProperty("onBackColor")) {
							node.blynkClient.setProperty(pin, "onBackColor", RED.util.ensureString(msg.onBackColor), msgkey);
						}
						if (msg.hasOwnProperty("offBackColor")) {
							node.blynkClient.setProperty(pin, "offBackColor", RED.util.ensureString(msg.offBackColor), msgkey);
						}
					}
				
					if(node.blynkClient.multi_cmd) {
						node.blynkClient.sendMsgMulti(msgkey);
					} 

				}
			}
		});

		this.on("close", function() {
			if(node.blynkClient) {
				node.blynkClient.removeInputNode(node);
			}
		});
	}
	
	RED.nodes.registerType("blynk-ws-style-btn", BlynkStyleBtnNode);
};