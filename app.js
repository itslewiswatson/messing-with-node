var express		= require("express");
var app 		= express();
var bodyParser 	= require("body-parser");
var port 		= process.env.PORT || 3000;
var router 		= express.Router();

var User 		= require("./models/users");

// Allows us to pull data from POST requests
// And allows us to use JSON in our response
// Automatically adjusts our response headers to 'application/json'
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

router.use(function(req, res, next) {
	//console.log("Incoming connection");
	next();
});

router.get("/", function (req, res) {
	res.json({message: "api.twenti.co"});
});

router.route("/users")
	.post(function(req, res) {
		res.json({message: "post"});
	})
	.get(function(req, res) {
		res.json({message: "get"});
	})
	.put(function(req, res) {
		res.json({message: "put"});
	})
	.delete(function(req, res) {
		res.json({message: "delete"});
	});

router.route("/users/:name")
	.get(function(req, res) {
		res.json({message: "get " + req.params.name});
	})

app.use("/", router);
app.listen(port);

console.log("Ready to accept API requests on port " + port);
