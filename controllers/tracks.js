/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

			// Idea
				// Currently integer fields return as string in the json response
				// Loop through all fields
				// Check if parseInt(field) returns a number
				// If it does, set the field's value to parseInt of it's value
				/*
					if (parseInt(field)) {
						field = parseInt(field);
					}
				*/
				// Should see if it's able to be made into a one-liner
			// eg: data.uploaded = parseInt(data.uploaded);

var Track 		= {}
var postgre 	= require("../models/postgre.js");
var db			= postgre.db;
var pgp 		= postgre.pgp;
var qrm 		= pgp.queryResult;
var async		= require("async");
var _json 		= require("../helpers/json.js");
var __cache 	= require("../models/cache.js");

// Constants
const GET_MANY_MAX_TRACKS = 10;
const GET_MANY_SEPARATOR = ",";

var columns = {
	"main": ["trackid", "title", "description", "uploaded", "artists"]
};

Track.getSingle = function(req, res) {
	var id = req.params.id;

	async.parallel({
		main: function(callback) {
			setTimeout(function () {
				// See if we can retrive it from the cache
				// Tracks use 'track:id.type' syntax in the cache, where type is 'main', 'plays' or 'views'
				__cache.get("track:" + id + ".main", function(err, value) {
					if (err) {
						//console.log("Could not get cache for .main");
						db.one("select ${columns^} from tracks where trackid = ${trackid}", {trackid: id, columns: columns.main.map(pgp.as.name).join()})
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
		stats: function(callback) {
			setTimeout(function () {
				__cache.get("track:" + id + ".stats", function (err, value) {
					if (err) {
						//console.log("Could not get cache for .stats");
						db.one(
							"SELECT (" + 
								"SELECT COALESCE(COUNT(*), 0) " + 
								"FROM tracks__plays " +
								"WHERE trackid = ${trackid} " +
							") AS plays, " +
							"(" +
								"SELECT COALESCE(COUNT(*), 0) " + 
								"FROM tracks__plays " +
								"WHERE trackid = ${trackid} " +
							") AS views", {trackid: id}
						)
							.then(function(data) {
								callback(null, data);
							})
							.catch(function(err) {
								callback(err, null);
							})
					}
					else {
						console.log("Using cache for .stats");
						callback(null, value);
					}
				})
			});
		}
	},
	function(err, results) {
		if (err) {
			res.json({message: "error"});
			return;
		}

		// Cache the track data if it's not already cached
		__cache.get("track:" + id + ".main", function(_err, value) {
			if (_err) {
				__cache.set("track:" + id + ".main", results.main, function(err, success) {
					if (err) {
						console.log("Error setting cache for: " + "track:" + id + ".main");
					}
					else {
						console.log("Cached: " + "track:" + id + ".main");
					}
				});
			}
		});
		__cache.get("track:" + id + ".stats", function(_err, value) {
			if (_err) {
				__cache.set("track:" + id + ".stats", results.stats, function(err, success) {
					if (err) {
						console.log("Error setting cache for: " + "track:" + id + ".stats");
					}
					else {
						console.log("Cached: " + "track:" + id + ".stats");
					}
				});
			}
		});

		res.json(
			{
				"response": {
					"data": {
						"tracks": [
							_json.extend({}, results.main, {"stats": results.stats}) // Should make this async and perform it somewhere else
						]
					}
				}
			}
		);
	});
}

Track.getMany = function(req, res) {
	// .clean() is from /helpers/array.js and extended the default JavaScript array class
	var ids = req.params.id.split(GET_MANY_SEPARATOR).clean("");
	// Trim the array to a maximum of tracks
	if (ids.length > GET_MANY_MAX_TRACKS) {
		for (i = ids.length; i >= GET_MANY_MAX_TRACKS; i--) {
			ids.splice(i, 1);
		}
	}

	// https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#where-col-in-values
	// https://github.com/vitaly-t/pg-promise/issues/267
	//db.query("select ${columns^} from tracks where trackid in (" + pgp.as.format("$1^", pgp.as.csv(ids)) + ")", {columns: columns.map(pgp.as.name).join()}, qrm.any)

	async.parallel({
		// Retrieve ones that are cached and query for ones that aren't cached
		main: function(callback) {
			setTimeout(function () {
				// The aim in this function is to send all the results at once

				var preResults = []; // Results we already have
				var toFetch = []; // Ones that need to be fetched

				// Cannot use .mget
				for (i = 0; i < ids.length; i++) {
					__cache.get("track:" + ids[i] + ".main", function (err, value) {
						if (err) {
							toFetch.push(ids[i]);
						}
						else {
							preResults.push(value);
						}
					});
				}

				if (toFetch.length > 0) {
					db.query("select ${columns^} from tracks where trackid in (${trackid:csv})", {trackid: toFetch, columns: columns.main.map(pgp.as.name).join()}, qrm.many)
						.then(function(data) {
							// We need to push each as an object and not as an array
							/*
								example:
									[{"trackid": ...}] -> is not okay
									{"trackid": ...} -> is okay
							*/
							if (data.length > 1) {
								for (i = 0; i < data.length; i++) {
									preResults.push(data[i]);
								}
							}
							else {
								preResults.push(data[0]);
							}
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
		}/*,
		stats: function(callback) {
			setTimeout(function () {
			});
		}
		*/
	},
	function(err, results) {
		if (err) {
			res.json({message: "error"});
			return;
		}

		var tracksArray = results.main;
		for (i = 0; i < tracksArray.length; i++) {
			if (tracksArray[i].trackid == undefined) {
				console.log(tracksArray);
			}
			console.log("Going through " + tracksArray[i].trackid);
			__cache.get("track:" + tracksArray[i].trackid + ".main", function(_err, value) {
				if (_err) {
					__cache.set("track:" + tracksArray[i].trackid + ".main", tracksArray[i], function (err, success) {
						if (err) {
							console.log("Failed to update cache for " + tracksArray[i].trackid);
						}
						else {
							console.log("Added cache for " + tracksArray[i].trackid);
						}
					});
				}
			});
		}

		res.json(
			{
				"response": {
					"data": {
						tracks: tracksArray
					}
				}
			}
		);
	});
}

Track.getAll = function(req, res) {
	db.many("select * from tracks")
		.then(function(data) {

		})
		.catch(function(err) {
			res.json(
				{
					"response": {
						"data": null
					}
				}
			);
		});
}

module.exports = {
	getSingle: Track.getSingle,
	getMany: Track.getMany,
	getAll: Track.getAll
}