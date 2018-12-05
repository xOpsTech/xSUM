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

function Api(){};

async function startCurrentJobs() {
    var jobList = await MongoDB.getAllData(AppConstants.DB_JOB_LIST, {});

    console.log('------------Start executing existing jobs------------');
    for (var i = 0; i < jobList.length; i++) {

        var jobToStart = jobList[i];

        if (jobToStart.isRecursiveCheck) {
            (
                function(i) {
                    jobTimers[jobToStart.jobId] = setInterval(
                        () => {
                            executeJob(AppConstants.DB_JOB_LIST, jobList[i]);
                        },
                        jobToStart.recursiveSelect.value
                    );
                }
            )(i);
            console.log('Started executing: ', jobToStart);
        }

    }
    console.log('------------Started executing existing jobs------------');

}

startCurrentJobs();

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

Api.prototype.insertUrlData = async function(req, res) {
    var urlObj = req.body;
    var currentDate = new Date();
    var urlInsertObj = {
        ID: urlObj.hashID,
        url: urlObj.urlValue,
        dateTime: currentDate.toString(),
        status: 'New',
        resultID: ''
    };

    await MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj);

    executeResultGenerator(AppConstants.DB_URL_LIST, urlInsertObj);

    res.send(urlInsertObj);
}

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

    await MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj);

    executeResultGenerator(AppConstants.DB_URL_LIST, urlInsertObj);

    res.send(urlInsertObj);
}

Api.prototype.getUrlData = async function(req, res) {
    var urlObj = req.body;
    var queryObj = {ID: urlObj.hashID};
    var urlData = await MongoDB.getAllData(AppConstants.DB_URL_LIST, queryObj);
    res.send(urlData);
}

Api.prototype.getLoggedUserUrlData = async function(req, res) {
    var urlObj = req.body;
    var queryObj = {
        userEmail: urlObj.userEmail,
        status: 'Done'
    };
    var urlData = await MongoDB.getAllData(AppConstants.DB_URL_LIST, queryObj);
    res.send(urlData);
}

function executeResultGenerator(collectionName, objectToInsert) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = 'California';
    var locationLatitude = 36.7783;
    var locationLongitude = -119.4179;

    //Send process request to sitespeed
    var commandStr = 'sudo docker run --rm sitespeedio/sitespeed.io:7.3.6' +
        ' --influxdb.host ' + config.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database xsum' +
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
        case "updateJob":
            new Api().updateJob(req, res);
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.insertJob = async function(req, res) {
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

    var queryObj = {userEmail: jobObj.userEmail};
    var jobData = await MongoDB.getAllData(AppConstants.DB_JOB_LIST, queryObj);

    if (jobData.length < 5) {
        await MongoDB.insertData(AppConstants.DB_JOB_LIST, jobInsertObj);

        jobTimers[jobObj.jobId] = setInterval(
            function() {
                executeJob(AppConstants.DB_JOB_LIST, jobInsertObj)
            },
            jobObj.recursiveSelect.value
        );

        executeScheduleJob(AppConstants.DB_JOB_LIST, jobInsertObj);

        res.send(jobInsertObj);
    } else {
        res.send({error: 'You can add only five jobs'});
    }
}

function executeScheduleJob(collectionName, insertedObject) {
    executeJob(collectionName, insertedObject);
}

Api.prototype.getAllJobs = async function(req, res) {
    var userObj = req.body;
    var queryObj = {userEmail: userObj.userEmail};
    var urlData = await MongoDB.getAllData(AppConstants.DB_JOB_LIST, queryObj);
    res.send(urlData);
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

Api.prototype.updateJob = function(req, res) {
    var jobObj = req.body.job;
    clearInterval(jobTimers[jobObj.jobId]);

    var updateValueObj = {
        jobName: jobObj.jobName,
        siteObject: {value: jobObj.siteObject.value},
        browser: jobObj.browser
    };

    MongoDB.updateData(AppConstants.DB_JOB_LIST, {jobId: jobObj.jobId}, updateValueObj);

    // Start the job
    jobTimers[jobObj.jobId] = setInterval(
        function() {
            executeJob(AppConstants.DB_JOB_LIST, jobObj)
        },
        jobObj.recursiveSelect.value
    );

    res.send(jobObj);
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
        ' --influxdb.host ' + config.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database xsum' +
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
            //MongoDB.updateData(collectionName, {jobId: objectToInsert.jobId}, newValueObj);
            AlertApi.sendEmailAsAlert(objectToInsert, curDateMilliSec);
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
    var yesterDay = moment().subtract(6, 'hours').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
    InfluxDB.getAllData(
        "SELECT * FROM pageLoadTime where jobid='" + jobObj.jobID+ "' and time >= '" + yesterDay + "'"
    ).then((result) => {
        res.send(result);
    }).catch((error) => {
        res.send(error);
    });
}

module.exports = new Api();
