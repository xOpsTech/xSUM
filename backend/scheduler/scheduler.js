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

var jobTimers = {};

function Scheduler(){};

Scheduler.prototype.startScheduler = async function() {
    executeAllJobs();
    setInterval(
        () => {
            executeAllJobs();
        },
        1000*60*10
    );
}

async function executeAllJobs() {
    var tenantList = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});
    var currentDateTime = moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT);

    console.log('------------Start executing existing jobs for ' + currentDateTime + ' ------------');
    for (let tenant of tenantList) {

        var jobList = await MongoDB.getAllData(String(tenant._id), AppConstants.DB_JOB_LIST, {});

        for (let job of jobList) {

            if (job.isRecursiveCheck &&
                job.serverLocation &&
                parseInt(job.serverLocation.locationid) === config.SERVER_LOCATION_ID) {
                executeJob(String(tenant._id), AppConstants.DB_JOB_LIST, job);
                console.log('Start executing: ', job);
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
            //MongoDB.updateData(AppConstants.DB_NAME, collectionName, {jobId: jobToExecute.jobId}, newValueObj);
            AlertApi.sendEmailAsAlert(databaseName, jobToExecute, curDateMilliSec);
        }
    );
}

module.exports = new Scheduler();
