/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

var User = {}
var postgre 	= require("../models/postgre.js");
var db			= postgre.db;
var async		= require("async");
var _json 		= require("../helpers/json.js");
var __cache 	= require("../models/cache.js");
var __array		= require("../helpers/array.js");

// Constants
const GET_MANY_MAX_USERS = 10;
const GET_MANY_SEPARATOR = ",";

var columns = ["userid", "handle", "permalink", "avatarurl", "country", "description", "websiteurl", "websitetitle"];

User.getSingle = function(req, res) {
	var id = req.params.id;

	async.parallel({
		main: function(callback) {
			setTimeout(function () {
				// See if we can retrive it from the cache
				// Users use 'user:id.type' syntax in the cache, where type is 'main' or 'stats'
				__cache.get("user:" + id + ".main", function(err, value) {
					if (err) {
						console.log("Could not get cache for .main");
						db.one("SELECT ${fields^} FROM users WHERE userid = ${userid}", {userid: id, fields: columns.join()})
							.then(function(data) {
								callback(null, data);
							})
							.catch(function(err) {
								callback(err, null);
							})
					}
					else {
						console.log("Using cache for .main");
						callback(null, value);
					}
				});
			});
		},

        /*  Add the function for STATS here */
        /*                                  */
        /*----------------------------------*/

	},
	function(err, results) {
		if (err) {
			res.json({message: "error", detail: err});
			console.log(err);
			return;
		}

		// Cache the user data if it's not already cached
		__cache.get("user:" + id + ".main", function(_err, value) {
			if (_err) {
				__cache.set("user:" + id + ".main", results.main, function(err, success) {
					if (err) {
						console.log("Error setting cache for: " + "user:" + id + ".main");
					}
					else {
						console.log("Cached: " + "user:" + id + ".main");
					}
				});
			}
		});
	    /*  Cache the STATS here    */
        /*                          */
        /*--------------------------*/

		res.json(
			{
				"response": {
					"data": {
						"users": [
                            results.main
                        ]
					}
				}
			}
		);
	});
}

User.getMany = function(req, res) {
	// .clean() is from /helpers/array.js and extended the default JavaScript array class
	var ids = __array.removeDuplicates(req.params.id.split(GET_MANY_SEPARATOR).clean(""));

	// Trim the array to a maximum of users
	if (ids.length > GET_MANY_MAX_USERS) {
		for (i = ids.length; i >= GET_MANY_MAX_USERS; i--) {
			ids.splice(i, 1);
		}
	}

	async.parallel({
		// Retrieve ones that are cached and query for ones that aren't cached
		main: function(callback) {
			setTimeout(function () {
				// The aim in this function is to send all the results at once

				var preResults = []; // Results we already have
				var toFetch = []; // Ones that need to be fetched

				// This is the same as a normal for-loop
				async.eachSeries(ids, function(key, next) {
					// Cannot use .mget
					__cache.get("user:" + key + ".main", function (err, value) {
						if (err) {
							toFetch.push(key);
						}
						else {
							preResults.push(value);
						}
					});
					next();
				}, function(err) {
					if (err) {
						console.log("Could not iterate through User.getMany at 'main'");
						console.log(err);
					}
				});

				if (toFetch.length > 0) {
					db.manyOrNone("SELECT ${fields^} FROM users WHERE userid IN (${userid:csv}) LIMIT ${maxUsers}", {userid: toFetch, maxUsers: GET_MANY_MAX_USERS, fields: columns.join()})
						.then(function(data) {
							// We need to push each as an object and not as an array
							/*
								example:
									[{"userid": ...}] -> is not okay
									{"userid": ...} -> is okay
							*/

							// Spread operator
							// Splits the data array into different variables, to be used as arguments
							// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Spread_operator
							preResults.push(...data);
							callback(null, preResults);
						})
						.catch(function(err) {
							callback(err, null);
						});
				}
				else {
					// All cached data has been pushed to preResults and we don't need to worry about fetching anything - just send it
					callback(null, preResults);
				}
			});
		}
		/*	Users Stats here	*/
		/*						*/
		/*----------------------*/
	},
	function(err, results) {
		if (err) {
			res.json({message: "error", detail: err});
			console.log(err);
			return;
		}

		var usersArray = results.main;

		for (i = 0; i < usersArray.length; i++) {
			// Cache .main (if needed) for users returned from results
			__cache.get("user:" + usersArray[i].userid + ".main", function(_err, value) {
				if (_err) {
					__cache.set("user:" + usersArray[i].userid + ".main", usersArray[i], function(err, success) {
						if (err) {
							console.log("Failed to update cache for " + usersArray[i].userid);
						}
						else {
							console.log("Added main cache for " + usersArray[i].userid);
						}
					});
				}
			});

			/*	Cache User Stats Here	*/
			/*							*/
			/*--------------------------*/
		}

		// Response
		res.json(
			{
				"response": {
					"data": {
						users: usersArray
					}
				}
			}
		);
	});
}

module.exports = {
	getSingle: User.getSingle,
	getMany: User.getMany,
}