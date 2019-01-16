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

function UpdatePoints(){};

UpdatePoints.prototype.updatePointsInDatabase = async function() {
    var tenantList = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});
    var currentDateTime = moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT);

    var totalMilliSecondsForMonth = AppConstants.TOTAL_MILLISECONDS_PER_MONTH; // Milliseconds

    console.log('------------Start updating points in ' + currentDateTime + ' ------------');
    for (let tenant of tenantList) {

        // Get the job list for current tenant
        var totalPointsUsed = 0;
        var jobList = await MongoDB.getAllData(String(tenant._id), AppConstants.DB_JOB_LIST, {});

        for (let job of jobList) {
            var noOfExecutionsPerMonth = totalMilliSecondsForMonth / job.recursiveSelect.value;
            totalPointsUsed += noOfExecutionsPerMonth;
        }

        var totalPointsRemain = tenant.points.totalPoints - parseInt(totalPointsUsed);

        // Update tenant points
        var queryObj = {_id: ObjectId(tenant._id)};
        var tenantUpdateObj = {
            points: {
                totalPoints: tenant.points.totalPoints,
                pointsRemain: totalPointsRemain
            }
        };

        console.log('Update points of ', tenant);
        MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryObj, tenantUpdateObj);
    }
    console.log('--------------------------------------------------------------------------------');
}

module.exports = new UpdatePoints();
