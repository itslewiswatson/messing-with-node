var db = require("../models/postgre.js");
var Track = {}

Track.getSingle = function(req, res) {
	var id = req.params.id;
	db.one("select * from tracks where uniqueid = $1", id)
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
	console.log(ids);

	// https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#where-col-in-values
	db.any("select * from tracks where uniqueid in ($1:csv)", [ids])
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
			//console.log(err);
			res.json(
				{
					"response": {
						"data": null
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