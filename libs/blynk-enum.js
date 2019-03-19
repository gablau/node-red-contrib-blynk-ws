/* blynk enum */

var MsgType = {
	RSP           :  0,
    
	//app commands
	LOGIN         :  29,
	PING          :  6,
	
	//HARDWARE commands
	TWEET         :  12,
	EMAIL         :  13,
	NOTIFY        :  14,
	BRIDGE        :  15,
	HW_SYNC       :  16,
	INTERNAL      :  17,
	SMS           :  18,
	PROPERTY      :  19,
	HW            :  20,
   
	REDIRECT    : 41,
	DEBUG_PRINT 		: 55,
	EVENT_LOG		 	: 64,

};

var MsgStatus = {
	OK                          : 200,
	QUOTA_LIMIT_EXCEPTION       : 1,
	ILLEGAL_COMMAND             : 2,
	NOT_REGISTERED              : 3, //user
	ALREADY_REGISTERED          : 4, //user
	NOT_AUTHENTICATED           : 5, //user
	NOT_ALLOWED                 : 6, //user
	DEVICE_NOT_IN_NETWORK       : 7,
	NO_ACTIVE_DASHBOARD         : 8, 
	INVALID_TOKEN               : 9,
	ILLEGAL_COMMAND_BODY        : 11, 
	//GET_GRAPH_DATA_EXCEPTION    : 12,
	NOTIFICATION_INVALID_BODY 	: 13,
	NOTIFICATION_NOT_AUTHORIZED : 14,
	NOTIFICATION_ERROR 			: 15,
	//reserved
	//BLYNK_TIMEOUT               : 16,
	NO_DATA_EXCEPTION           : 17,
	//DEVICE_WENT_OFFLINE       : 18, //removed
	SERVER_EXCEPTION            : 19,
	//NOT_SUPPORTED_VERSION       : 20, //removed
	ENERGY_LIMIT                  : 21,
	FACEBOOK_USER_LOGIN_WITH_PASS : 22,
};

exports.MsgType = MsgType;
exports.MsgStatus = MsgStatus;