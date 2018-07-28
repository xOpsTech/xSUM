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
        case "insertLoggedUserUrlData":
            new Api().insertLoggedUserUrlData(req, res);
            break;
        case "getUrlData":
            new Api().getUrlData(req, res);
            break;
        case "getLoggedUserUrlData":
            new Api().getLoggedUserUrlData(req, res);
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
    var urlInsertObj = {
        ID: urlObj.hashID,
        url: urlObj.urlValue,
        dateTime: currentDate.toString(),
        status: 'New',
        resultUrl: ''
    };

    MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj, res);
}

Api.prototype.insertLoggedUserUrlData = function(req, res) {
    var urlObj = req.body;
    var currentDate = new Date();
    var urlInsertObj = {
        ID: urlObj.hashID,
        url: urlObj.urlValue,
        dateTime: currentDate.toString(),
        status: 'New',
        resultUrl: '',
        userEmail: urlObj.userEmail
    };

    MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj, res);
}

Api.prototype.getUrlData = function(req, res) {
    var urlObj = req.body;
    var queryObj = {ID: urlObj.hashID};
    MongoDB.fetchData(AppConstants.DB_URL_LIST, queryObj, res);
}

Api.prototype.getLoggedUserUrlData = function(req, res) {
    var urlObj = req.body;
    var queryObj = {
        userEmail: urlObj.userEmail,
        status: 'Done'
    };
    MongoDB.fetchData(AppConstants.DB_URL_LIST, queryObj, res);
}

module.exports = new Api();
