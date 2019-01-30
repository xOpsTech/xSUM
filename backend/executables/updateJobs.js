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
var {ObjectId} = require('mongodb');

var jobTimers = {};

function UpdateJobs(){};

UpdateJobs.prototype.updateJobsInDatabase = async function() {
    var tenantList = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});
    var currentDateTime = moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT);

    console.log('------------Start updating jobs in ' + currentDateTime + ' ------------');
    for (let tenant of tenantList) {

        // Get the job list for current tenant
        var jobList = await MongoDB.getAllData(String(tenant._id), AppConstants.DB_JOB_LIST, {});

        for (let job of jobList) {
            var siteURL = job.siteObject.value.replace(/http:\/\//g, '');

            if (job.securityProtocol === undefined) {
                var queryObj = {_id: ObjectId(job._id)};
                var jobUpdateObj = {
                    securityProtocol: 'http://',
                    siteObject: {
                        value: siteURL
                    }
                };
                MongoDB.updateData(String(tenant._id), AppConstants.DB_JOB_LIST, queryObj, jobUpdateObj);
                console.log('Update job: ', job)
            }


        }
    }
    console.log('--------------------------------------------------------------------------------');
}

module.exports = new UpdateJobs();
