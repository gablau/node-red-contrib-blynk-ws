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
			this.blynkClient.on("disabled", function() {
				node.status({
					fill: "red",
					shape: "dot",
					text: "blynk-ws-out-set-property.status.disabled"
				});
			});
		
			this.on("input", function(msg) {

				//no input operation if client not connected or disabled
				if(!node.blynkClient || !node.blynkClient.logged) {
					return; 
				}
				
				if (msg.hasOwnProperty("payload")) {
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
                
					if (msg.hasOwnProperty("prop")) {
						prop = RED.util.ensureString(msg.prop);
					}
					if(prop!=="bycode"){ //single property
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
						if (msg.hasOwnProperty("label")) {
							node.blynkClient.setProperty(pin, "label", RED.util.ensureString(msg.label), msgkey);
						}
						if (msg.hasOwnProperty("color")) {
							node.blynkClient.setProperty(pin, "color", RED.util.ensureString(msg.color), msgkey);
						}
						if (msg.hasOwnProperty("min")) {
							node.blynkClient.setProperty(pin, "min", RED.util.ensureString(msg.min), msgkey);
						}
						if (msg.hasOwnProperty("max")) {
							node.blynkClient.setProperty(pin, "max", RED.util.ensureString(msg.max), msgkey);
						}
						//buttons and styled buttons label
						if ((msg.hasOwnProperty("onlabel") || msg.hasOwnProperty("offlabel"))) {
							if (msg.hasOwnProperty("onlabel")) {
								node.blynkClient.setProperty(pin, "onLabel", RED.util.ensureString(msg.onlabel), msgkey);
							}
							if (msg.hasOwnProperty("offlabel")) {
								node.blynkClient.setProperty(pin, "offLabel", RED.util.ensureString(msg.offlabel), msgkey);
							}
						}
						//styled buttons color (need server v0.36.2)
						if ((msg.hasOwnProperty("onColor") || msg.hasOwnProperty("offColor") || 
							 msg.hasOwnProperty("onBackColor") || msg.hasOwnProperty("offBackColor"))
							) {
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
						//menu
						else if (msg.hasOwnProperty("labels")) {
							//todo check is array and count > 0
							node.blynkClient.setProperty(pin, "labels", msg.labels, msgkey);
						}
						//music player
						else if (msg.hasOwnProperty("isOnPlay")) {
							var isonplay = false;
							if (msg.isonplay) isonplay = true;
							node.blynkClient.setProperty(pin, "isonplay", isonplay, msgkey);
						}
						//video streaming widget
						else if (msg.hasOwnProperty("url") && !msg.hasOwnProperty("imgid")) {
							node.blynkClient.setProperty(pin, "url", RED.util.ensureString(msg.url), msgkey);
						}
						//step (need server v0.32.2)
						else if (msg.hasOwnProperty("step")) {
							var step = RED.util.ensureString(msg.step);
							node.blynkClient.setProperty(pin, "step", step, msgkey);
						}
						//fraction on slider widget (need server v0.33.3)
						else if (msg.hasOwnProperty("maximumFractionDigits")) {
							var fraction = RED.util.ensureString(msg.maximumFractionDigits);
							node.blynkClient.setProperty(pin, "maximumFractionDigits", fraction, msgkey);
						}
						//image gallery widget (need server v0.40.x ??)
						else if (msg.hasOwnProperty("imgid") && msg.hasOwnProperty("url")) {
							var imgid = RED.util.ensureString(msg.imgid);
							var url = RED.util.ensureString(msg.url);
							node.blynkClient.setProperty(pin, "url", [imgid, url], msgkey);
						}
						else if (msg.hasOwnProperty("opacity")) {
							var opacity = RED.util.ensureString(msg.opacity);
							node.blynkClient.setProperty(pin, "opacity", opacity, msgkey);
						}
						else if (msg.hasOwnProperty("scale")) {
							var scale = RED.util.ensureString(msg.scale);
							node.blynkClient.setProperty(pin, "scale", scale, msgkey);
						}
						else if (msg.hasOwnProperty("rotation")) {
							var rotation = RED.util.ensureString(msg.rotation);
							node.blynkClient.setProperty(pin, "rotation", rotation, msgkey);
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