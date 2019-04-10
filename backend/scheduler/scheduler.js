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
const K8sConfig = require('kubernetes-client').config;

const Client = require('kubernetes-client').Client;
const client = new Client({
    config: {
        url: config.CLUSTER_URL,
        auth: {
            user: AppConstants.CLUSTER_USERNAME,
            pass: AppConstants.CLUSTER_PASSWORD,
        },
        insecureSkipTlsVerify: true,
    }
});

var jobTimers = {};

function Scheduler(){};

Scheduler.prototype.startScheduler = async function() {

    for (var executionFrequency of AppConstants.RECURSIVE_EXECUTION_ARRAY) {
        executeAllJobs(executionFrequency);
        removeJobs(executionFrequency);
        setInterval(
            await scheduleJobExecute(executionFrequency),
            executionFrequency.value
        );
    }

}

async function scheduleJobExecute(executionFrequency) {
    return function() {
        removeJobs(executionFrequency);
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
                    } else if (job.testType === AppConstants.SCRIPT_TEST_TYPE) {
                        Helpers.executeScriptJob(String(tenant._id), AppConstants.DB_JOB_LIST, job);
                    } else if (job.testType === AppConstants.PING_TEST_TYPE || job.testType === AppConstants.ONE_TIME_TEST_TYPE) {
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

async function removeJobs(executionFrequency) {

    // Execute remove job each hour
    if (parseInt(executionFrequency.value) === 1000*60*60) {
        await client.loadSpec();
        const job = client.apis.batch.v1.namespaces('default').jobs.get().then(async function(jobsObj) {

            for (var job of jobsObj.body.items) {

                if (job.status.completionTime !== undefined) {
                    var diff = moment.duration(moment().diff(moment(job.status.completionTime)));
                    var diffHours = Math.floor(diff.asHours());

                    if (diffHours > 1) {
                        await client.apis.batch.v1.namespaces('default').jobs(job.metadata.name).delete();
                        console.log("Job deletion success from cluster", job.metadata.name);
                    }

                }

            }

        });
    }

}

function executeJob(databaseName, collectionName, jobToExecute) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = jobToExecute.serverLocation.textValue;
    var locationLatitude = jobToExecute.serverLocation.latitude;
    var locationLongitude = jobToExecute.serverLocation.longitude;

    var curDateMilliSec = new Date().getTime();

    //Send process request to sitespeed
    var commandStr = 'sudo docker run --shm-size=1g --rm -v' +
        ' "$(pwd)":/sitespeed.io sitespeedio/sitespeed.io:8.7.5 -n 1' +
        ' --influxdb.host ' + config.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database ' + databaseName +
        ' --browser ' + jobToExecute.browser +
        ' --influxdb.tags "jobid=' + jobToExecute.jobId + ',resultID=' + resultID
        + ',locationTitle=' + locationTitle + ',latitude=' + locationLatitude
        + ',longitude=' + locationLongitude + ',curDateMilliSec=' + curDateMilliSec + '" '
        + jobToExecute.securityProtocol + jobToExecute.siteObject.value;
    cmd.get(
        commandStr,
        async function(err, data, stderr) {
            // jobToExecute.result.push({resultID: resultID, executedDate: new Date()});
            // var newValueObj = {
            //     result: jobToExecute.result
            // };

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
