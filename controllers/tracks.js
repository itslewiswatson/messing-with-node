/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

var Track = {}
var postgre = require("../models/postgre.js");
var db = postgre.db;
var pgp = postgre.pgp;
var qrm = pgp.queryResult;

var columns = {
	"main": ["uniqueid", "title", "description", "artists", "uploaded"],
	"statistics": [""]
};

Track.getSingle = function(req, res) {
	var id = req.params.id;
	db.one("select ${columns^} from tracks where uniqueid = ${uniqueid}", {uniqueid: id, columns: columns.main.map(pgp.as.name).join()})
		.then(function(data) {
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
			res.status(200)
				.json(
					{
						"response": {
							"data": {
								"tracks": [
									data
								]
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
						"data": null
					}
				}
			);
		});
}

Track.getMany = function(req, res) {
	// .clean() is from /helpers/array.js and extended the default JavaScript array class
	var ids = req.params.id.split(",").clean("");
	// Trim the array to a maximum of tracks
	if (ids.length > 10) {
		for (i = ids.length; i >= 10; i--) {
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
	//db.query("select ${columns^} from tracks where uniqueid in (" + pgp.as.format("$1^", pgp.as.csv(ids)) + ")", {columns: columns.map(pgp.as.name).join()}, qrm.any)

	// Main query
	db.query("select ${columns^} from tracks where uniqueid in (${uniqueids:csv})", {uniqueids: ids, columns: columns.main.map(pgp.as.name).join()}, qrm.any)
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
	db.query()
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