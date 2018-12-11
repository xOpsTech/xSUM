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

function JobApi(){};

async function startCurrentJobs() {
    var tenantList = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});

    console.log('------------Start executing existing jobs------------');
    for (let tenant of tenantList) {

        var jobList = await MongoDB.getAllData(String(tenant._id), AppConstants.DB_JOB_LIST, {});

        for (let job of jobList) {

            if (job.isRecursiveCheck) {
                jobTimers[job.jobId] = setInterval(
                    () => {
                        executeJob(String(tenant._id), AppConstants.DB_JOB_LIST, job);
                    },
                    job.recursiveSelect.value
                );
                console.log('Started executing: ', job);
            }

        }

    }
    console.log('------------Started executing existing jobs------------');
}

startCurrentJobs();

JobApi.prototype.handleJobs = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "insertJob":
            new JobApi().insertJob(req, res);
            break;
        case "removeJob":
            new JobApi().removeJob(req, res);
            break;
        case "getAllJobs":
            new JobApi().getAllJobs(req, res);
            break;
        case "startorStopJob":
            new JobApi().startorStopJob(req, res);
            break;
        case "updateJob":
            new JobApi().updateJob(req, res);
            break;
        default:
            res.send("no data");
    }
}

JobApi.prototype.insertJob = async function(req, res) {
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
    var jobData = await MongoDB.getAllData(jobObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    if (jobData.length < 5) {
        await MongoDB.insertData(jobObj.tenantID, AppConstants.DB_JOB_LIST, jobInsertObj);

        jobTimers[jobObj.jobId] = setInterval(
            function() {
                executeJob(jobObj.tenantID, AppConstants.DB_JOB_LIST, jobInsertObj)
            },
            jobObj.recursiveSelect.value
        );

        executeScheduleJob(jobObj.tenantID, AppConstants.DB_JOB_LIST, jobInsertObj);

        res.send(jobInsertObj);
    } else {
        res.send({error: 'You can add only five jobs'});
    }
}

function executeScheduleJob(databaseName, collectionName, insertedObject) {
    executeJob(databaseName, collectionName, insertedObject);
}

JobApi.prototype.getAllJobs = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var urlData = await MongoDB.getAllData(userObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);
    res.send(urlData);
}

JobApi.prototype.removeJob = function(req, res) {
    var jobObj = req.body;
    var queryToRemoveJob = {
        jobId: jobObj.jobId
    };
    clearInterval(jobTimers[jobObj.jobId]);
    MongoDB.deleteOneData(jobObj.tenantID, AppConstants.DB_JOB_LIST, queryToRemoveJob);
    InfluxDB.removeData(jobObj.tenantID, "DROP SERIES FROM pageLoadTime WHERE jobid='" + jobObj.jobId+ "'");
    res.send(queryToRemoveJob);
}

JobApi.prototype.updateJob = function(req, res) {
    var jobObj = req.body.job;
    clearInterval(jobTimers[jobObj.jobId]);

    var updateValueObj = {
        jobName: jobObj.jobName,
        siteObject: {value: jobObj.siteObject.value},
        browser: jobObj.browser
    };

    MongoDB.updateData(jobObj.tenantID, AppConstants.DB_JOB_LIST, {jobId: jobObj.jobId}, updateValueObj);

    // Start the job
    jobTimers[jobObj.jobId] = setInterval(
        function() {
            executeJob(AppConstants.DB_NAME, AppConstants.DB_JOB_LIST, jobObj)
        },
        jobObj.recursiveSelect.value
    );

    res.send(jobObj);
}

JobApi.prototype.startorStopJob = function(req, res) {
    var jobObj = req.body.job;
    if (jobObj.recursiveSelect.isStart) {
        // Start the job
        jobTimers[jobObj.jobId] = setInterval(
            function() {
                //console.log("jobObj.jobId", jobObj.jobId)
                executeJob(AppConstants.DB_NAME, AppConstants.DB_JOB_LIST, jobObj)
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

    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.DB_JOB_LIST, {jobId: jobObj.jobId}, newValueObj);

    res.send(jobObj);
}

function executeJob(databaseName, collectionName, objectToInsert) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = 'California';
    var locationLatitude = 36.7783;
    var locationLongitude = -119.4179;

    var curDateMilliSec = new Date().getTime();

    //Send process request to sitespeed
    var commandStr = 'sudo docker run --rm sitespeedio/sitespeed.io:7.3.6' +
        ' --influxdb.host ' + config.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database ' + databaseName +
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
            //MongoDB.updateData(AppConstants.DB_NAME, collectionName, {jobId: objectToInsert.jobId}, newValueObj);
            AlertApi.sendEmailAsAlert(databaseName, objectToInsert, curDateMilliSec);
        }
    );
}

module.exports = new JobApi();
