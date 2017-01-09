var mongoose = require("mongoose");

mongoose.connect("mongodb://twenti.co:27017/twenti", function (err) {
    if (err) console.log(err);
});