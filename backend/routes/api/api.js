var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var path = require('path');
var cmd = require('node-cmd');
var crypto = require('crypto');
var moment = require('moment');
var Helpers = require('../../common/Helpers');

var jobTimers = {};

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
        resultID: ''
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
        resultID: '',
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
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = 'California';
    var locationLatitude = 36.7783;
    var locationLongitude = -119.4179;

    //Send process request to sitespeed
    var commandStr = 'sudo docker run --rm sitespeedio/sitespeed.io:7.3.6' +
        ' --influxdb.host ' + AppConstants.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database xsum' +
        ' --influxdb.tags "jobid=' + objectToInsert.ID + ',resultID=' + resultID
        + ',locationTitle=' + locationTitle + ',latitude=' + locationLatitude
        + ',longitude=' + locationLongitude + '" ' + objectToInsert.url;
    cmd.get(
        commandStr,
        function(err, data, stderr) {
            var newValueObj = {
                status: 'Done',
                resultID: resultID
            };
            MongoDB.updateData(collectionName, {ID: objectToInsert.ID}, newValueObj);
        }
    );
}

Api.prototype.handleJobs = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "insertJob":
            new Api().insertJob(req, res);
            break;
        case "removeJob":
            new Api().removeJob(req, res);
            break;
        case "getAllJobs":
            new Api().getAllJobs(req, res);
            break;
        case "startorStopJob":
            new Api().startorStopJob(req, res);
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.insertJob = function(req, res) {
    var jobObj = req.body;

    var jobInsertObj = {
        jobId: jobObj.jobId,
        siteObject: {value: jobObj.siteObject.value},
        browser: jobObj.browser,
        scheduleDate: jobObj.scheduleDate,
        isRecursiveCheck: jobObj.isRecursiveCheck,
        recursiveSelect: jobObj.recursiveSelect,
        result: [],
        userEmail: jobObj.userEmail,
        jobName: jobObj.jobName
    };

    MongoDB.insertJobWithUserCheck(AppConstants.DB_JOB_LIST, jobInsertObj, res, executeScheduleJob);

    jobTimers[jobObj.jobId] = setInterval(
        function() {
            executeJob(AppConstants.DB_JOB_LIST, jobInsertObj)
        },
        jobObj.recursiveSelect.value
    );
}

function executeScheduleJob(collectionName, insertedObject) {
    executeJob(collectionName, insertedObject);
}

Api.prototype.getAllJobs = function(req, res) {
    var userObj = req.body;
    var queryObj = {userEmail: userObj.userEmail};
    MongoDB.fetchData(AppConstants.DB_JOB_LIST, queryObj, res);
}

Api.prototype.removeJob = function(req, res) {
    var jobObj = req.body;
    var queryToRemoveJob = {
        jobId: jobObj.jobId
    };
    clearInterval(jobTimers[jobObj.jobId]);
    MongoDB.deleteOneData(AppConstants.DB_JOB_LIST, queryToRemoveJob, res);
    InfluxDB.removeData("DROP SERIES FROM pageLoadTime WHERE jobid='" + jobObj.jobId+ "'");
}

Api.prototype.startorStopJob = function(req, res) {
    var jobObj = req.body.job;
    if (jobObj.recursiveSelect.isStart) {
        // Start the job
        jobTimers[jobObj.jobId] = setInterval(
            function() {
                //console.log("jobObj.jobId", jobObj.jobId)
                executeJob(AppConstants.DB_JOB_LIST, jobObj)
            },
            jobObj.recursiveSelect.value
        );
    } else {
        // Stop the job
        clearInterval(jobTimers[jobObj.jobId]);
    }

    var newValueObj = {
        recursiveSelect: jobObj.recursiveSelect
    };

    MongoDB.updateData(AppConstants.DB_JOB_LIST, {jobId: jobObj.jobId}, newValueObj);

    res.send(jobObj);
}

function executeJob(collectionName, objectToInsert) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = 'California';
    var locationLatitude = 36.7783;
    var locationLongitude = -119.4179;

    var curDateMilliSec = new Date().getTime();

    //Send process request to sitespeed
    var commandStr = 'sudo docker run --rm sitespeedio/sitespeed.io:7.3.6' +
        ' --influxdb.host ' + AppConstants.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database xsum' +
        ' --browser ' + objectToInsert.browser +
        ' --influxdb.tags "jobid=' + objectToInsert.jobId + ',resultID=' + resultID
        + ',locationTitle=' + locationTitle + ',latitude=' + locationLatitude
        + ',longitude=' + locationLongitude + ',curDateMilliSec=' + curDateMilliSec + '" '
        + objectToInsert.siteObject.value;
    cmd.get(
        commandStr,
        async function(err, data, stderr) {
            objectToInsert.result.push({resultID: resultID, executedDate: new Date()});
            var newValueObj = {
                result: objectToInsert.result
            };
            MongoDB.updateData(collectionName, {jobId: objectToInsert.jobId}, newValueObj);

            // Send alert
            var jobResults = await InfluxDB.getAllDataFor(
                "SELECT * FROM pageLoadTime where jobid='"
                + objectToInsert.jobId + "' and curDateMilliSec = '" + curDateMilliSec + "'"
            );

            var queryToGetJobAlert = {
                'job.jobId': objectToInsert.jobId
            };

            var alertObjData = await MongoDB.getAllData(AppConstants.ALERT_LIST, queryToGetJobAlert);

            if (alertObjData.length > 0) {

                for (var j = 0; j < jobResults.length; j++) {

                    if (jobResults[j].mean/1000 > parseInt(alertObjData[0].criticalThreshold)) {

                        // Send warning alert
                        var emailBodyToSend = 'Hi ,<br><br>' +
                                                'The job you have added for <b>' +
                                                objectToInsert.siteObject.value +
                                                '</b> is having high respnse time.<br><br>' +
                                                'Regards,<br>xSUM admin';

                        Helpers.sendEmail(objectToInsert.userEmail, 'Critical Alert from xSUM', emailBodyToSend);
                        break;
                    } else if (jobResults[j].mean/1000 > parseInt(alertObjData[0].warningThreshold)) {

                        // Send critical alert
                        var emailBodyToSend = 'Hi ,<br><br>' +
                                                'The job you have added for <b>' +
                                                objectToInsert.siteObject.value +
                                                '</b> is having high respnse time.<br><br>' +
                                                'Regards,<br>xSUM admin';

                        Helpers.sendEmail(objectToInsert.userEmail, 'Warning Alert from xSUM', emailBodyToSend);
                        break;
                    }

                }

            }

        }
    );
}

Api.prototype.handleResults = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "getResult":
            new Api().getResult(req, res);
            break;
        case "getAllResultsForJob":
            new Api().getAllResultsForJob(req, res);
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.getResult = function(req, res) {
    var resultObj = req.body;
    InfluxDB.getAllData(
        "SELECT * FROM pageLoadTime where resultID='" + resultObj.resultID+ "'"
    ).then((result) => {
        res.send(result);
    }).catch((error) => {
        res.send(error);
    });
}

Api.prototype.getAllResultsForJob = function(req, res) {
    var jobObj = req.body;
    var yesterDay = moment().subtract(1, 'days').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
    InfluxDB.getAllData(
        "SELECT * FROM pageLoadTime where jobid='" + jobObj.jobID+ "' and time >= '" + yesterDay + "'"
    ).then((result) => {
        res.send(result);
    }).catch((error) => {
        res.send(error);
    });
}

module.exports = new Api();
