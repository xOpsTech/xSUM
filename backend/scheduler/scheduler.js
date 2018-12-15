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

module.exports = new Scheduler();
