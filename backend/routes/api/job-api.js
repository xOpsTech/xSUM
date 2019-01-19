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
var TenantApi = require('./tenant-api');
var {ObjectId} = require('mongodb');

var jobTimers = {};

function JobApi(){};

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
        case "getAllJobsWithResults":
            new JobApi().getAllJobsWithResults(req, res);
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
        testType: jobObj.testType,
        scheduleDate: jobObj.scheduleDate,
        isRecursiveCheck: jobObj.isRecursiveCheck,
        recursiveSelect: jobObj.recursiveSelect,
        result: [],
        userEmail: jobObj.userEmail,
        jobName: jobObj.jobName,
        serverLocation: jobObj.serverLocation,
        alerts: {
            critical: [],
            warning: []
        }

    };

    var queryToGetTenantObj = {_id: ObjectId(jobObj.tenantID)};
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantObj);

    var totalPointsRemain = tenantData[0].points.pointsRemain -
                                    (AppConstants.TOTAL_MILLISECONDS_PER_MONTH / jobObj.recursiveSelect.value);

    if (totalPointsRemain >= 0 ) {
        await MongoDB.insertData(jobObj.tenantID, AppConstants.DB_JOB_LIST, jobInsertObj);

        TenantApi.updateTenantPoints(jobObj.jobId, jobObj.tenantID, true);

        res.send(jobInsertObj);
    } else {
        res.send({error: AppConstants.POINT_NOT_ENOUGH_ERROR});
    }
}

JobApi.prototype.getAllJobs = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var urlData = await MongoDB.getAllData(userObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);
    res.send(urlData);
}

JobApi.prototype.getAllJobsWithResults = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var jobsList = await MongoDB.getAllData(userObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var locationsArr = [];

    for (let job of jobsList) {

        var dataTable = '';
        if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE) {
            dataTable = AppConstants.PERFORMANCE_RESULT_LIST;
        } else {
            dataTable = AppConstants.PING_RESULT_LIST;
        }

        var yesterDay = moment().subtract(6, 'hours').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
        var jobResults = await InfluxDB.getAllDataFor(
            userObj.tenantID,
            "SELECT * FROM " + dataTable + " where jobid='" + job.jobId + "' and time >= '" + yesterDay + "'"
        );

        job.result = jobResults;

        var isLocationFound = locationsArr.find(function(locationObj) {
            return (locationObj.locationid === job.serverLocation.locationid);
        });

        if (!isLocationFound) {
            locationsArr.push(job.serverLocation);
        }

    }

    var objectToSend = {jobsList: jobsList, locations: locationsArr};

    res.send(objectToSend);
}

JobApi.prototype.removeJob = function(req, res) {
    var jobObj = req.body;
    var queryToRemoveJob = {
        jobId: jobObj.jobId
    };
    TenantApi.updateTenantPoints(jobObj.jobId, jobObj.tenantID, false);
    MongoDB.deleteOneData(jobObj.tenantID, AppConstants.DB_JOB_LIST, queryToRemoveJob);
    InfluxDB.removeData(jobObj.tenantID, "DROP SERIES FROM pageLoadTime WHERE jobid='" + jobObj.jobId+ "'");
    res.send(queryToRemoveJob);
}

JobApi.prototype.updateJob = function(req, res) {
    var jobObj = req.body.job;

    var updateValueObj = {
        jobName: jobObj.jobName,
        siteObject: {value: jobObj.siteObject.value},
        browser: jobObj.browser
    };

    MongoDB.updateData(jobObj.tenantID, AppConstants.DB_JOB_LIST, {jobId: jobObj.jobId}, updateValueObj);

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

module.exports = new JobApi();
