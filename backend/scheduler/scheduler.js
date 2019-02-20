var MongoDB = require('../db/mongodb');
var InfluxDB = require('../db/influxdb');
var AppConstants = require('../constants/AppConstants');
var config = require('../config/config');
var path = require('path');
var cmd = require('node-cmd');
var crypto = require('crypto');
var moment = require('moment');
var Helpers = require('../common/Helpers');
var AlertApi = require('../routes/api/alert-api');
var request = require('request');

var jobTimers = {};

function Scheduler(){};

Scheduler.prototype.startScheduler = async function() {

    for (var executionFrequency of AppConstants.RECURSIVE_EXECUTION_ARRAY) {
        executeAllJobs(executionFrequency);
        setInterval(
            await scheduleJobExecute(executionFrequency),
            executionFrequency.value
        );
    }

}

async function scheduleJobExecute(executionFrequency) {
    return function(){
        executeAllJobs(executionFrequency);
    };
}

async function executeAllJobs(executionFrequency) {
    var tenantList = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});
    var currentDateTime = moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT);

    console.log('------------Start executing existing jobs for ' + currentDateTime + ' ------------');
    for (let tenant of tenantList) {
        var jobList = await MongoDB.getAllData(String(tenant._id), AppConstants.DB_JOB_LIST, {});

        for (let job of jobList) {

            if (parseInt(job.recursiveSelect.value) === parseInt(executionFrequency.value)) {

                if (job.isRecursiveCheck &&
                    job.serverLocation &&
                    parseInt(job.serverLocation.locationid) === config.SERVER_LOCATION_ID) {

                    if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE) {
                        executeJob(String(tenant._id), AppConstants.DB_JOB_LIST, job);
                    } else if (job.testType === AppConstants.PING_TEST_TYPE) {
                        job.urlValue = job.siteObject.value;
                        job.currentDateTime = currentDateTime;
                        // Execute ping test
                        Helpers.executePingJob(String(tenant._id), job, false);
                    }

                    console.log('Start executing: ', job);
                }

            }

        }

    }
    console.log('--------------------------------------------------------------------------------');

}

function executeJob(databaseName, collectionName, jobToExecute) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = jobToExecute.serverLocation.textValue;
    var locationLatitude = jobToExecute.serverLocation.latitude;
    var locationLongitude = jobToExecute.serverLocation.longitude;

    var curDateMilliSec = new Date().getTime();

    //Send process request to sitespeed
    var commandStr = 'sudo docker run --rm sitespeedio/sitespeed.io:7.3.6' +
        ' --influxdb.host ' + config.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database ' + databaseName +
        ' --browser ' + jobToExecute.browser +
        ' --influxdb.tags "jobid=' + jobToExecute.jobId + ',resultID=' + resultID
        + ',locationTitle=' + locationTitle + ',latitude=' + locationLatitude
        + ',longitude=' + locationLongitude + ',curDateMilliSec=' + curDateMilliSec + '" '
        + jobToExecute.siteObject.value;
    cmd.get(
        commandStr,
        async function(err, data, stderr) {
            jobToExecute.result.push({resultID: resultID, executedDate: new Date()});
            var newValueObj = {
                result: jobToExecute.result
            };

            if (err) {
                console.log('Error in executing the job : ', jobToExecute.jobId);
                console.log('Error : ', err);
            } else if (stderr) {
                console.log('STD Error in executing the job : ', jobToExecute.jobId);
                console.log('STD Error : ', stderr);
            } else {
                console.log('Successfully executed the job : ', jobToExecute.jobId);
            }

            //MongoDB.updateData(AppConstants.DB_NAME, collectionName, {jobId: jobToExecute.jobId}, newValueObj);
            //AlertApi.sendEmailAsAlert(databaseName, jobToExecute, curDateMilliSec);
        }
    );
}

module.exports = new Scheduler();
