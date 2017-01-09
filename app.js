var express		= require("express");
var app 		= express();
var bodyParser 	= require("body-parser");
var port 		= process.env.PORT || 3000;
var router 		= express.Router();

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

app.use("/", router);
app.listen(port);

console.log("Ready to accept API requests on port " + port);
