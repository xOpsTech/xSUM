var MongoDB = require('../../db/mongodb');
var AppConstants = require('../../constants/AppConstants');
var path = require('path');
var cmd = require('node-cmd');

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

    MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj, res, executeResultGenerator);
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

    MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj, res, executeResultGenerator);
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

function executeResultGenerator(collectionName, objectToInsert) {
    var siteName = objectToInsert.url.split('/')[2];
    var pathToResult = './sitespeed-result/' + siteName + '/' + objectToInsert.ID;
    // Send process request to sitespeed
    var commandStr = 'docker run --shm-size=1g --rm -v "$(pwd)":/sitespeed.io sitespeedio/sitespeed.io:7.2.1 --outputFolder ' + pathToResult + ' ' + objectToInsert.url;
    cmd.get(
        commandStr,
        function(err, data, stderr) {
            var newValueObj = {
                status: 'Done',
                resultUrl: pathToResult
            };
            MongoDB.updateData(collectionName, objectToInsert.ID, newValueObj);
        }
    );
}

module.exports = new Api();
