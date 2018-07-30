module.exports = function(RED) {
	"use strict";

	function BlynkOutSetPropertyNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.prop = n.prop;
		this.pinmode = n.pinmode; 
        
		
        
		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {

			if(this.pinmode == 1) 
				this.connected_label = RED._("blynk-ws-out-set-property.status.connected-dynamic");
			else
				this.connected_label = RED._("blynk-ws-out-set-property.status.connected-fixed") + this.pin; 
			
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-set-property.status.connecting") + n
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
					text: "blynk-ws-out-set-property.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-set-property.status.disconnected"
				});
			});
		
			this.on("input", function(msg) {
				if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
					var payload = msg.payload; //dont check if is a string
					//var subject = msg.topic ? msg.topic : payload;
					var prop = node.prop;
					var pin = node.pin;
					if(node.pinmode == 1) {
						if (!msg.hasOwnProperty("pin")) {
							node.warn(RED._("blynk-ws-out-set-property.warn.pin-dinamic"));
							return;
						}
						if(msg.pin<0 || msg.pin>127) {
							node.warn(RED._("blynk-ws-out-set-property.warn.pin-value"));
							return;
						}
						pin = msg.pin;
					}
                
					if (msg.hasOwnProperty("prop") && node.blynkClient && node.blynkClient.logged) {
						prop = Buffer.isBuffer(msg.prop) ? msg.prop : RED.util.ensureString(msg.prop);
					}
					if(prop!=="bycode"){ //single propery
						if(prop == ""){
							node.warn(RED._("blynk-ws-out-set-property.warn.bycode"));
							return;
						}
						node.blynkClient.setProperty(pin, prop, payload); 
					}
					else { //multiple property
						var msgkey = undefined;
						if(node.blynkClient.multi_cmd) {
							msgkey = node.blynkClient.startMsgMulti();
						} 

						//all widget
						if (msg.hasOwnProperty("label") && node.blynkClient && node.blynkClient.logged) {
							var label = Buffer.isBuffer(msg.label) ? msg.label : RED.util.ensureString(msg.label);
							node.blynkClient.setProperty(pin, "label", label, msgkey);
						}
						if (msg.hasOwnProperty("color") && node.blynkClient && node.blynkClient.logged) {
							var color = Buffer.isBuffer(msg.color) ? msg.color : RED.util.ensureString(msg.color);
							node.blynkClient.setProperty(pin, "color", color, msgkey);
						}
						if (msg.hasOwnProperty("min") && node.blynkClient && node.blynkClient.logged) {
							var min = Buffer.isBuffer(msg.min) ? msg.min : RED.util.ensureString(msg.min);
							node.blynkClient.setProperty(pin, "min", min, msgkey);
						}
						if (msg.hasOwnProperty("max") && node.blynkClient && node.blynkClient.logged) {
							var max = Buffer.isBuffer(msg.max) ? msg.max : RED.util.ensureString(msg.max);
							node.blynkClient.setProperty(pin, "max", max, msgkey);
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
						//menu
						else if (msg.hasOwnProperty("labels") && node.blynkClient && node.blynkClient.logged) {
							node.blynkClient.setProperty(pin, "labels", msg.labels, msgkey);
						}
						//music player
						else if (msg.hasOwnProperty("isOnPlay") && node.blynkClient && node.blynkClient.logged) {
							var isonplay = false;
							if (msg.isonplay) isonplay = true;
							node.blynkClient.setProperty(pin, "isonplay", isonplay, msgkey);
						}
						//video streaming widget
						else if (msg.hasOwnProperty("url") && node.blynkClient && node.blynkClient.logged) {
							var url = Buffer.isBuffer(msg.url) ? msg.url : RED.util.ensureString(msg.url);
							node.blynkClient.setProperty(pin, "url", url, msgkey);
						}
						//step (need server v0.32.2)
						else if (msg.hasOwnProperty("step") && node.blynkClient && node.blynkClient.logged) {
							var step = Buffer.isBuffer(msg.step) ? msg.step : RED.util.ensureString(msg.step);
							node.blynkClient.setProperty(pin, "step", step, msgkey);
						}
						//fraction on slider widget (need server v0.33.3)
						else if (msg.hasOwnProperty("maximumFractionDigits") && node.blynkClient && node.blynkClient.logged) {
							var fraction = Buffer.isBuffer(msg.maximumFractionDigits) ? msg.maximumFractionDigits : RED.util.ensureString(msg.maximumFractionDigits);
							node.blynkClient.setProperty(pin, "maximumFractionDigits", fraction, msgkey);
						}
					
						if(node.blynkClient.multi_cmd) {
							node.blynkClient.sendMsgMulti(msgkey);
						} 

					}
				}
			});
		}
		else {
			this.error(RED._("blynk-ws-out-set-property.errors.missing-conf"));
		}  
	}
	
	RED.nodes.registerType("blynk-ws-out-set-property", BlynkOutSetPropertyNode);
};