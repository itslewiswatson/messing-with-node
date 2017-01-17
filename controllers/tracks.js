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
						db.one("select ${columns^} from tracks where trackid = ${trackid}", {trackid: id, columns: columns.main.map(pgp.as.name).join()})
							.then(function(data) {
								callback(null, data);
							})
							.catch(function(err) {
								callback(err, null);
							})
					}
					else {
						callback(null, value);
					}
				});
			});
		},
		stats: function(callback) {
			setTimeout(function () {
				__cache.get("track:" + id + ".stats", function (err, value) {
					if (err) {
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

	// START DEBUG
	//console.log(ids);
	//console.log(columns.map(pgp.as.name).join());
	//console.log(pgp.as.format("$1^", pgp.as.csv(ids)));
	// END DEBUG

	// https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#where-col-in-values
	// https://github.com/vitaly-t/pg-promise/issues/267
	//db.query("select ${columns^} from tracks where trackid in (" + pgp.as.format("$1^", pgp.as.csv(ids)) + ")", {columns: columns.map(pgp.as.name).join()}, qrm.any)

	// Main query
	db.query("select ${columns^} from tracks where trackid in (${trackid:csv})", {trackid: ids, columns: columns.main.map(pgp.as.name).join()}, qrm.any)
		.then(function(data) {
			res.json(
				{
					"response": {
						"data": {
							"tracks": data // The JSON array [] is part of 'data'
						}
					}
				}
			);
		})
		.catch(function(err) {
			console.log(err);
			res.json(
				{
					"response": {
						"data": err
					}
				}
			);
		});

	// Statistics
	//db.query()
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