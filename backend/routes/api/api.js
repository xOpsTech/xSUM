var MongoDB = require('../../db/mongodb');
var AppConstants = require('../../constants/AppConstants');
var path = require('path');

function Api(){};

Api.prototype.handleHTML = function(req, res) {
    res.sendFile(path.join(__dirname, '../../../', 'index.html'));
}

Api.prototype.handleUrlData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "insertUrlData":
            new Api().insertUrlData(req, res);
            break;
        case "getUrlData":
            new Api().getUrlData(req, res);
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.handleTestData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "getTestData":
            res.send({'test': 'testdata'})
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.insertUrlData = function(req, res) {
    var urlObj = req.body;
    var currentDate = new Date();
    var urlInsertObj = {ID: urlObj.hashID, url: urlObj.urlValue, dateTime: currentDate.toString(), status: 'New', resultUrl: ''};

    MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj, res);
}

Api.prototype.getUrlData = function(req, res) {
    var urlObj = req.body;
    MongoDB.fetchData(AppConstants.DB_URL_LIST, {ID: urlObj.hashID}, res);
}

module.exports = new Api();
