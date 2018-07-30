/* blynk enum */

var MsgType = {
	RSP           :  0,
    
	//app commands
	REGISTER      :  1, //"mail pass"
	LOGIN         :  2, //"token" or "mail pass"
	SAVE_PROF     :  3,
	LOAD_PROF     :  4,
	GET_TOKEN     :  5,
	PING          :  6,
	ACTIVATE      :  7, //"DASH_ID"
	DEACTIVATE    :  8, //
	REFRESH       :  9, //"refreshToken DASH_ID"
	GET_GRAPH_DATA : 10,
	GET_GRAPH_DATA_RESPONSE : 11,
    
	//HARDWARE commands
	TWEET         :  12,
	EMAIL         :  13,
	NOTIFY        :  14,
	BRIDGE        :  15,
	HW_SYNC       :  16,
	INTERNAL      :  17, //0x11
	SMS           :  18,
	PROPERTY      :  19,
	HW            :  20, //0x14
    
	//app commands
	CREATE_DASH         : 21,
	UPDATE_DASH         : 22,
	DELETE_DASH         : 23,
	LOAD_PROF_GZ        : 24,
	APP_SYNC            : 25,
	SHARING             : 26,
	ADD_PUSH_TOKEN      : 27,
	EXPORT_GRAPH_DATA   : 28,
	HW_LOGIN            : 29,
	//app sharing commands
	GET_SHARE_TOKEN     : 30,
	REFRESH_SHARE_TOKEN : 31,
	SHARE_LOGIN         : 32,
    
	//app commands
	CREATE_WIDGET       : 33,
	UPDATE_WIDGET       : 34,
	DELETE_WIDGET       : 35,

	//energy commands
	GET_ENERGY          : 36,
	ADD_ENERGY          : 37,

	UPDATE_PROJECT_SETTINGS : 38,

	ASSIGN_TOKEN        : 39,
	GET_SERVER          : 40,
	CONNECT_REDIRECT    : 41,

	CREATE_DEVICE       : 42,
	UPDATE_DEVICE       : 43,
	DELETE_DEVICE       : 44,
	GET_DEVICES         : 45,

	CREATE_TAG          : 46,
	UPDATE_TAG          : 47,
	DELETE_TAG          : 48,
	GET_TAGS            : 49,

	APP_CONNECTED       : 50,

	UPDATE_FACE         : 51,
	//web sockets
	WEB_SOCKETS         : 52,
	EVENTOR             : 53,
	WEB_HOOKS           : 54,
    
	CREATE_APP 					: 55,
	UPDATE_APP 					: 56,
	DELETE_APP 					: 57,
	GET_PROJECT_BY_TOKEN 		: 58,
	EMAIL_QR 					: 59,
	GET_ENHANCED_GRAPH_DATA 	: 60,
	DELETE_ENHANCED_GRAPH_DATA 	: 61,

	GET_CLONE_CODE 				: 62,
	GET_PROJECT_BY_CLONE_CODE 	: 63,

	HARDWARE_LOG_EVENT 			: 64,
	HARDWARE_RESEND_FROM_BLUETOOTH : 65,
	LOGOUT 						: 66,

	CREATE_TILE_TEMPLATE : 67,
	UPDATE_TILE_TEMPLATE : 68,
	DELETE_TILE_TEMPLATE : 69,
	GET_WIDGET			 : 70,
	DEVICE_OFFLINE 		 : 71,
	OUTDATED_APP_NOTIFICATION : 72,
	TRACK_DEVICE 		 : 73,
	GET_PROVISION_TOKEN : 74,

	/*
    //http codes. Used only for stats
    HTTP_IS_HARDWARE_CONNECTED 	: 82,
    HTTP_IS_APP_CONNECTED 		: 83,
    HTTP_GET_PIN_DATA 			: 84,
    HTTP_UPDATE_PIN_DATA 		: 85,
    HTTP_NOTIFY	 				: 86,
    HTTP_EMAIL 					: 87,
    HTTP_GET_PROJECT 			: 88,
    HTTP_QR 					: 89,
    HTTP_GET_HISTORY_DATA 		: 90,
    HTTP_START_OTA 				: 91,
    HTTP_STOP_OTA 				: 92,
    HTTP_CLONE 					: 93,
    HTTP_TOTAL 					: 94,
    */
};

var MsgStatus = {
	OK                          : 200,
	QUOTA_LIMIT_EXCEPTION       : 1,
	ILLEGAL_COMMAND             : 2,
	NOT_REGISTERED              : 3,
	ALREADY_REGISTERED          : 4,
	NOT_AUTHENTICATED           : 5,
	NOT_ALLOWED                 : 6,
	DEVICE_NOT_IN_NETWORK       : 7,
	NO_ACTIVE_DASHBOARD         : 8, 
	INVALID_TOKEN               : 9,
	ILLEGAL_COMMAND_BODY        : 11, 
	GET_GRAPH_DATA_EXCEPTION    : 12,
	NOTIFICATION_INVALID_BODY 	: 13,
	NOTIFICATION_NOT_AUTHORIZED : 14,
	NOTIFICATION_ERROR 			: 15,
	//reserved
	BLYNK_TIMEOUT               : 16,
	NO_DATA_EXCEPTION           : 17,
	//DEVICE_WENT_OFFLINE       : 18, //removed
	SERVER_EXCEPTION            : 19,
	//NOT_SUPPORTED_VERSION       : 20, //removed
	ENERGY_LIMIT                  : 21,
	FACEBOOK_USER_LOGIN_WITH_PASS : 22,
};

exports.MsgType = MsgType;
exports.MsgStatus = MsgStatus;