/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

// https://www.npmjs.com/package/node-cache

// Constants
const CACHE_CHECK_PERIOD 			= 300; 		// 300s = 5m
const CACHE_DEFAULT_TTL 			= 1800; 	// 1800s = 30m
const CACHE_THROW_ERR_MISSING		= true; 	// true = throw an error when unable to retrieve key, false = return undefined instead
const CACHE_RETURN_COPY 			= false; 	// true = return copy of variable, false = return reference of variable

const NodeCache = require("node-cache");
const __cache = new NodeCache({
	stdTTL: 			CACHE_DEFAULT_TTL,
	checkperiod: 		CACHE_CHECK_PERIOD,
	errorOnMissing: 	CACHE_THROW_ERR_MISSING,
	useClones: 			CACHE_RETURN_COPY
});

module.exports = __cache;