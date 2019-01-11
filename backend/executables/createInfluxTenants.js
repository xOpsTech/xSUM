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

function CreateTenants(){};

CreateTenants.prototype.createInfluxTenants = async function() {
    var tenantList = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});
    var currentDateTime = moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT);

    console.log('------------Start creating tenants in ' + currentDateTime + ' ------------');
    for (let tenant of tenantList) {
        InfluxDB.createDatabase(String(tenant._id));
        console.log('Databse has been created for: ', tenant);
    }
    console.log('--------------------------------------------------------------------------------');
}

module.exports = new CreateTenants();
