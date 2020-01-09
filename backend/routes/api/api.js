var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var config = require('../../config/config');
var path = require('path');
var cmd = require('node-cmd');
var crypto = require('crypto');
var moment = require('moment');
var Helpers = require('../../common/Helpers');
var AlertApi = require('./alert-api');

var jobTimers = {};

function Api() {}

Api.prototype.handleHTML = function(req, res) {
    res.sendFile(path.join(__dirname, '../../../', 'index.html'));
};

Api.prototype.handleOneTimeHTML = function(req, res) {
    res.sendFile(path.join(__dirname, '../../one-time-results', 'result.html'));
};

Api.prototype.handleUrlData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case 'insertUrlData':
            new Api().insertUrlData(req, res);
            break;
        case 'insertLoggedUserUrlData':
            new Api().insertLoggedUserUrlData(req, res);
            break;
        case 'getUrlData':
            new Api().getUrlData(req, res);
            break;
        case 'getLoggedUserUrlData':
            new Api().getLoggedUserUrlData(req, res);
            break;
        case 'retensionPolicy':
            new Api().configureRetensionPolicy(req, res);
            break;
        case 'retensionDuration':
            new Api().getRetensionPolicyDuration(req, res);
            break;
        default:
            res.send('no data');
    }
};

// Api.prototype.getAccountData =function(req ,res){
//  console.log("Backend");
// }

Api.prototype.handleTestData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case 'getTestData':
            res.send({ test: 'testdata' });
            break;
        default:
            res.send('no data');
    }
};

Api.prototype.insertUrlData = async function(req, res) {
    var urlObj = req.body;
    var currentDate = new Date();
    var urlInsertObj = {
        jobId: urlObj.hashID,
        urlValue: urlObj.urlValue,
        dateTime: currentDate.toString(),
        status: 'New',
        resultID: '',
        location: {
            title: 'USA',
            latitude: 36.778259,
            longitude: -119.417931
        },
        securityProtocol: urlObj.securityProtocol
    };

    await MongoDB.insertData(
        AppConstants.DB_NAME,
        AppConstants.DB_URL_LIST,
        urlInsertObj
    );

    Helpers.executePingJob(AppConstants.DB_NAME, urlInsertObj, true);

    res.send(urlInsertObj);
};

Api.prototype.configureRetensionPolicy = async function(req, res) {
    var resultObj = req.body;

    var jobResults = await InfluxDB.configureRetensionPolicy(
        resultObj.database,
        resultObj.retension
    );

    res.send(jobResults);
};

Api.prototype.getRetensionPolicyDuration = async function(req, res) {
    console.log(678);
    var resultObj = req.body;

    var jobResults = await InfluxDB.getRetensionDuration(resultObj.database);

    res.send(jobResults);
};

Api.prototype.insertLoggedUserUrlData = async function(req, res) {
    var urlObj = req.body;
    var currentDate = new Date();
    var urlInsertObj = {
        ID: urlObj.hashID,
        url: urlObj.urlValue,
        dateTime: currentDate.toString(),
        status: 'New',
        resultID: '',
        userEmail: urlObj.userEmail
    };

    await MongoDB.insertData(
        AppConstants.DB_NAME,
        AppConstants.DB_URL_LIST,
        urlInsertObj
    );

    executePingJob(AppConstants.DB_URL_LIST, urlInsertObj);

    res.send(urlInsertObj);
};

Api.prototype.getUrlData = async function(req, res) {
    var urlObj = req.body;
    var queryObj = { jobId: urlObj.hashID };
    var urlData = await MongoDB.getAllData(
        AppConstants.DB_NAME,
        AppConstants.DB_URL_LIST,
        queryObj
    );
    res.send(urlData);
};

Api.prototype.getLoggedUserUrlData = async function(req, res) {
    var urlObj = req.body;
    var queryObj = {
        userEmail: urlObj.userEmail,
        status: 'Done'
    };
    var urlData = await MongoDB.getAllData(
        AppConstants.DB_NAME,
        AppConstants.DB_URL_LIST,
        queryObj
    );
    res.send(urlData);
};

function executeResultGenerator(collectionName, objectToInsert) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = 'California';
    var locationLatitude = 36.7783;
    var locationLongitude = -119.4179;

    //Send process request to sitespeed
    var commandStr =
        'sudo docker run --rm sitespeedio/sitespeed.io:7.3.6' +
        ' --influxdb.host ' +
        config.INFLUXDB_IP +
        ' --influxdb.port 8086 --influxdb.database xsum' +
        ' --influxdb.tags "jobid=' +
        objectToInsert.ID +
        ',resultID=' +
        resultID +
        ',locationTitle=' +
        locationTitle +
        ',latitude=' +
        locationLatitude +
        ',longitude=' +
        locationLongitude +
        '" ' +
        objectToInsert.url;
    cmd.get(commandStr, function(err, data, stderr) {
        var newValueObj = {
            status: 'Done',
            resultID: resultID
        };
        MongoDB.updateData(
            AppConstants.DB_NAME,
            collectionName,
            { ID: objectToInsert.ID },
            newValueObj
        );
    });
}




Api.prototype.handleResults = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case 'getResult':
            new Api().getResult(req, res);
            break;
        case 'getAllResultsForJob':
            new Api().getAllResultsForJob(req, res);
            break;
        default:
            res.send('no data');
    }
};

Api.prototype.getResult = async function(req, res) {
    var resultObj = req.body;

    var jobResults = await InfluxDB.getAllDataFor(
        AppConstants.DB_NAME,
        'SELECT * FROM ' +
            AppConstants.PING_RESULT_LIST +
            " where resultID='" +
            resultObj.resultID +
            "'"
    );

    var queryObj = { jobId: jobResults[0].jobid };
    var urlData = await MongoDB.getAllData(
        AppConstants.DB_NAME,
        AppConstants.DB_URL_LIST,
        queryObj
    );

    var resultsObj = urlData[0];
    resultsObj.results = jobResults[0];

    res.send(resultsObj);
};

Api.prototype.getAllResultsForJob = function(req, res) {
    var jobObj = req.body;
    var yesterDay = moment()
        .subtract(6, 'hours')
        .format(AppConstants.INFLUXDB_DATETIME_FORMAT);
    InfluxDB.getAllData(
        jobObj.tenantID,
        "SELECT * FROM pageLoadTime where jobid='" +
            jobObj.jobID +
            "' and time >= '" +
            yesterDay +
            "'"
    )
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            res.send(error);
        });
};

module.exports = new Api();
