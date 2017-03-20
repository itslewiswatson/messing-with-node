/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

var Track 		= {}
var postgre 	= require("../models/postgre.js");
var db			= postgre.db;
var pgp 		= postgre.pgp;
//var qrm 		= pgp.queryResult;
var async		= require("async");
var _json 		= require("../helpers/json.js");
var __cache 	= require("../models/cache.js");
var __array		= require("../helpers/array.js");

// Constants
const GET_MANY_MAX_TRACKS = 10;
const GET_MANY_SEPARATOR = ",";
const CACHE_STATS_TTL = 600; // 300s = 5m (stats should update more often)

var columns = ["trackid", "title", "description", "uploaded", "artists", "tags"];

Track.getSingle = function(req, res) {
	var id = req.params.id;

	async.parallel({
		main: function(callback) {
			setTimeout(function () {
				// See if we can retrive it from the cache
				// Tracks use 'track:id.type' syntax in the cache, where type is 'main' or 'stats'
				__cache.get("track:" + id + ".main", function(err, value) {
					if (err) {
						//console.log("Could not get cache for .main");
						db.one("SELECT ${fields^} FROM tracks WHERE trackid = ${trackid}", {trackid: id, fields: columns.join()})
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
				__cache.get("track:" + id + ".stats", function(err, value) {
					if (err) {
						//console.log("Could not get cache for .stats");
						db.one(
							"SELECT (" + 
								"SELECT COALESCE(COUNT(*), 0) " + 
								"FROM tracks__plays " +
								"WHERE trackid = ${trackid}" +
							") AS plays, " +
							"(" +
								"SELECT COALESCE(COUNT(*), 0) " + 
								"FROM tracks__plays " +
								"WHERE trackid = ${trackid}" +
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
		},
		/*
		artists: function(callback) {
			setTimeout(function () {
				__cache.get("track:" + id + ".artists", function(err, value) {
					if (err) {
						db.any("SELECT ")
					}
					else {

					}
				});
			});
			
		}
		*/
	},
	function(err, results) {
		if (err) {
			res.json({message: "error", detail: err});
			console.log(err);
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
				//console.log("results.stats for Track.getSingle: " + results.stats);
				//console.log(results.stats);
				__cache.set("track:" + id + ".stats", results.stats, CACHE_STATS_TTL, function(err, success) {
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
	var ids = __array.removeDuplicates(req.params.id.split(GET_MANY_SEPARATOR).clean(""));

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

				// This is the same as a normal for-loop
				async.eachSeries(ids, function(key, next) {
					// Cannot use .mget
					__cache.get("track:" + key + ".main", function (err, value) {
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
						console.log("Could not iterate through Tracks.getMany at 'main'");
						console.log(err);
					}
				});

				if (toFetch.length > 0) {
					db.manyOrNone("SELECT ${fields^} FROM tracks WHERE trackid IN (${trackid:csv}) LIMIT ${maxTracks}", {trackid: toFetch, maxTracks: GET_MANY_MAX_TRACKS, fields: columns.join()})
						.then(function(data) {
							// We need to push each as an object and not as an array
							/*
								example:
									[{"trackid": ...}] -> is not okay
									{"trackid": ...} -> is okay
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
		},
		stats: function(callback) {
			setTimeout(function () {
				// The aim in this function is to send all the results at once

				var preResults = []; // Results we already have
				var toFetch = []; // Ones that need to be fetched

				async.eachSeries(ids, function(key, next) {
					// Cannot use .mget
					__cache.get("track:" + key + ".stats", function (err, value) {
						if (err) {
							toFetch.push(key);
						}
						else {
							preResults.push(
								{
									trackid: key,
									plays: value.plays,
									views: value.views
								}
							);
						}
					});
					next();
				}, function(err) {
					if (err) {
						console.log("Could not iterate through Tracks.getMany at 'stats'");
						console.log(err);
					}
				});

				//console.log("toFetch.length : " + toFetch.length);
				if (toFetch.length > 0) {
					db.manyOrNone("SELECT A.trackid, " +
						"(SELECT COALESCE(COUNT(*), 0) FROM tracks__plays C WHERE C.trackid = A.trackid AND C.trackid = B.trackid) AS plays, " +
						"(SELECT COALESCE(COUNT(*), 0) FROM tracks__views D WHERE D.trackid = A.trackid AND D.trackid = B.trackid) AS views " +
						"FROM tracks__plays A, tracks__views B " +
						"WHERE A.trackid = B.trackid " +
						"AND A.trackid IN (${trackids:csv}) " +
						"GROUP BY A.trackid, B.trackid",
					{trackids: toFetch})
						.then(function(data) {
							// We need to push each as an object and not as an array
							//
							//	example:
							//		[{"trackid": ...}] -> is not okay
							//		{"trackid": ...} -> is okay
							//

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
					// However, it nests itself in another array, so just send preResults[0]
					//console.log(preResults[0]);
					callback(null, preResults);
				}
			});
		}
	},
	function(err, results) {
		if (err) {
			res.json({message: "error", detail: err});
			console.log(err);
			return;
		}

		var newstats = {}
		for (k = 0; k < results.stats.length; k++) {
			newstats[results.stats[k].trackid] = {"plays": results.stats[k].plays, "views": results.stats[k].views}
		}

		var tracksArray = results.main;

		for (i = 0; i < tracksArray.length; i++) {
			// Cache .main (if needed) for tracks returned from results
			__cache.get("track:" + tracksArray[i].trackid + ".main", function(_err, value) {
				if (_err) {
					if (tracksArray[i].stats) {
						console.log("TERMINATE NOW");
					}
					__cache.set("track:" + tracksArray[i].trackid + ".main", tracksArray[i], function(err, success) {
						if (err) {
							//console.log("Failed to update cache for " + tracksArray[i].trackid);
						}
						else {
							//console.log("Added main cache for " + tracksArray[i].trackid);
						}
					});
				}
			});

			// Cache .stats (if needed) for tracks returned from results
			__cache.get("track:" + tracksArray[i].trackid + ".stats", function(_err, value) {
				if (_err) {
					var trackStats = newstats[tracksArray[i].trackid];
					__cache.set("track:" + tracksArray[i].trackid + ".stats", trackStats, CACHE_STATS_TTL, function(err, success) {
						if (err) {
							//console.log("Failed to update cache for " + tracksArray[i].trackid);
						}
						else {
							//console.log("Added stats cache for " + tracksArray[i].trackid);
						}
					});
				}
			});

			tracksArray[i].stats = newstats[tracksArray[i].trackid];
		}

		// Response
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