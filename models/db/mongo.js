var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var url = "mongodb://twenti.com:27017/twenti";
var db;

onTryConnect = function (err, conn) {
	if (err) {
		//console.log("Could not connect to the MongoDB database. Error: " + err);
		throw new Error(err);
	}
	else {
		// Set the variable
		db = conn;
		
		console.log("Successfully connected to the MongoDB database");
		
		//var users = db.collection("users");
		
		/*
		users.find({name: "nokizorque"}).toArray(function (err, result) {
			if (err) {
				console.log(err);
			}
			else if (result.length) {
				console.log('Found:', result);
			}
			else {
				console.log('No document(s) found with defined "find" criteria!');
			}
		});
		*/
		
		//console.log(db.users);
		
		//return db;
	}
}

mongoClient.connect(url, onTryConnect);

exports.getMongo = function() {
	if (db == null) {
		//db = mongoClient.connect(url, onTryConnect);
	}
	//return db;
};
