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
var fileSystem = require('file-system');

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
        case "getAllJobsWithAResult":
            new JobApi().getAllJobsWithAResult(req, res);
            break;
        case "getVisibleJobsWithResults":
            new JobApi().getVisibleJobsWithResults(req, res);
            break;
        case "getAJobWithResults":
            new JobApi().getAJobWithResults(req, res);
            break;
        case "startorStopJob":
            new JobApi().startorStopJob(req, res);
            break;
        case "updateJob":
            new JobApi().updateJob(req, res);
            break;
        case "updateJobs":
            new JobApi().updateJobs(req, res);
            break;
        default:
            res.send("no data");
    }
}

JobApi.prototype.insertJob = async function(req, res) {
    var jobObj = req.body;

    var jobName = (jobObj.jobName === '') ? (jobObj.siteObject.value + '-Job') : jobObj.jobName;

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
        jobName: jobName,
        serverLocation: jobObj.serverLocation,
        alerts: {
            critical: [],
            warning: []
        },
        isShow: true,
        securityProtocol: jobObj.securityProtocol
    };

    if (jobObj.testType === AppConstants.SCRIPT_TEST_TYPE) {
        let scriptFilePath = 'scripts/tenantid-' + jobObj.tenantID + '/jobid-' + jobObj.jobId;
        let fileName = '/script-1.js';
        jobInsertObj.scriptPath = scriptFilePath + fileName;
        jobInsertObj.scriptValue = jobObj.scriptValue;
        fileSystem.mkdir(scriptFilePath, {recursive: true}, (err) => {

            if (err) {
                console.log('Error in creating directories' + scriptFilePath, err);
                throw err;
            } else {

                fileSystem.writeFile(scriptFilePath + fileName, jobObj.scriptValue, (err) => {
                    if (err) {
                        console.log('Error in creating file' + fileName, err);
                        throw err;
                    }
                });
            }

        });
    }

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
    var objectToSend = await Helpers.getJobsWithLocations(userObj.tenantID, false);
    res.send(objectToSend);
}

JobApi.prototype.getAllJobsWithAResult = async function(req, res) {
    var userObj = req.body;
    var tenantID = userObj.tenantID;
    var queryObj = {};

    var jobsList = await MongoDB.getAllData(tenantID, AppConstants.DB_JOB_LIST, queryObj);
    var locationsArr = [];

    for (let job of jobsList) {

        var dataTable = '';
        if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE) {
            dataTable = AppConstants.PERFORMANCE_RESULT_LIST;
        } else {
            dataTable = AppConstants.PING_RESULT_LIST;
        }

        var backDate = moment().subtract(1, 'days').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
        var jobResults = await InfluxDB.getAllDataFor(
            tenantID,
            "SELECT * FROM " + dataTable + " where jobid='" + job.jobId + "' and time >= '" + backDate + "' ORDER BY time DESC LIMIT 1"
        );

        job.result = jobResults;

        var isLocationFound = locationsArr.find(function(locationObj) {
            return (locationObj.locationid === job.serverLocation.locationid);
        });

        if (!isLocationFound) {
            locationsArr.push(job.serverLocation);
        }

    }

    var listObj = {jobsList: jobsList, locations: locationsArr};
    res.send(listObj);
}

JobApi.prototype.getVisibleJobsWithResults = async function(req, res) {
    var userObj = req.body;
    var objectToSend = await Helpers.getJobsWithLocations(userObj.tenantID, true);
    res.send(objectToSend);
}

JobApi.prototype.getAJobWithResults = async function(req, res) {
    var paramObj = req.body;
    var job = await Helpers.getAJobWithLocation(paramObj);
    res.send(job);
}

JobApi.prototype.removeJob = async function(req, res) {
    var jobObj = req.body;
    var queryToRemoveJob = {
        jobId: jobObj.jobId
    };

    if (jobObj.testType === AppConstants.SCRIPT_TEST_TYPE) {

        fileSystem.unlink(jobObj.scriptPath, (err) => {
            if (err) {
                console.log('Error in removing file' + jobObj.scriptPath, err);
                throw err;
            }
        });

    }

    await TenantApi.updateTenantPoints(jobObj.jobId, jobObj.tenantID, false);
    await MongoDB.deleteOneData(jobObj.tenantID, AppConstants.DB_JOB_LIST, queryToRemoveJob);
    InfluxDB.removeData(jobObj.tenantID, "DROP SERIES FROM pageLoadTime WHERE jobid='" + jobObj.jobId + "'");
    res.send(queryToRemoveJob);
}

JobApi.prototype.updateJob = async function(req, res) {
    var jobObj = req.body.job;

    var queryToGetTenantObj = {_id: ObjectId(jobObj.tenantID)};
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantObj);

    // Total points remain for tenant
    var totalPointsRemain = tenantData[0].points.pointsRemain;

    // Get the job from db
    var queryObj = {jobId: jobObj.jobId};
    var jobsList = await MongoDB.getAllData(jobObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    // Calculate point difference of before and after update job
    var jobBeforeUpdate = jobsList[0];
    var pointsUsedBefore = AppConstants.TOTAL_MILLISECONDS_PER_MONTH / jobBeforeUpdate.recursiveSelect.value;
    totalPointsRemain += pointsUsedBefore;

    var pointsUsingAfter = AppConstants.TOTAL_MILLISECONDS_PER_MONTH / jobObj.recursiveSelect.value;
    totalPointsRemain -= pointsUsingAfter;

    if (totalPointsRemain >= 0 ) {
        var jobName = (jobObj.jobName === '') ? (jobObj.siteObject.value + '-Job') : jobObj.jobName;

        var updateValueObj = {
            jobName: jobName,
            siteObject: {value: jobObj.siteObject.value},
            browser: jobObj.browser,
            serverLocation: jobObj.serverLocation,
            securityProtocol: jobObj.securityProtocol,
            recursiveSelect: jobObj.recursiveSelect,
            testType: jobObj.testType,
            scriptValue: jobObj.scriptValue
        };

        if (jobObj.testType === AppConstants.SCRIPT_TEST_TYPE) {

            fileSystem.writeFile(jobObj.scriptPath, jobObj.scriptValue, (err) => {
                if (err) {
                    console.log('Error in updating file' + fileName, err);
                    throw err;
                }
            });
        }

        await MongoDB.updateData(jobObj.tenantID, AppConstants.DB_JOB_LIST, {jobId: jobObj.jobId}, updateValueObj);

        TenantApi.updateTenantPoints(jobObj.jobId, jobObj.tenantID, false, totalPointsRemain);

        res.send(jobObj);
    } else {
        res.send({error: AppConstants.POINT_NOT_ENOUGH_UPDATE_ERROR});
    }

}

JobApi.prototype.updateJobs = async function(req, res) {
    var updateObject = req.body;

    for (let jobToUpdate of updateObject.jobList) {
        var updateValueObj = {
            isShow: jobToUpdate.isShow
        };
        await MongoDB.updateData(updateObject.tenantID, AppConstants.DB_JOB_LIST, {jobId: jobToUpdate.jobId}, updateValueObj);
    }

    res.send(updateObject);
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
