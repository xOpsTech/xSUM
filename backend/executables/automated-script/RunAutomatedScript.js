var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var config = require('../../config/config');
var path = require('path');
var cmd = require('node-cmd');
var crypto = require('crypto');
var moment = require('moment');
var Helpers = require('../../common/Helpers');
var AlertApi = require('../../routes/api/alert-api');
var request = require('request');
var {ObjectId} = require('mongodb');

var jobTimers = {};

function RunAutomatedScript(){};

RunAutomatedScript.prototype.executeAutomatedData = async function() {
    var currentDateTime = moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT);
    console.log('------------Start executing automated script in ' + currentDateTime + ' ------------');
    let automatedScriptData = require('./automated-script-data.json');

    for (let scriptData of automatedScriptData.dataList) {
        scriptData.userData.isScriptedUser = true;
        scriptData.userData.passTocken = scriptData.userData.password;

        // Create user
        let isUserCreated = await Helpers.isUserCreated(scriptData.userData, true);

        if (isUserCreated) {
            let jobObjectToInsert = {
                jobId: crypto.randomBytes(10).toString('hex'),
                tenantID: String(isUserCreated._id),
                siteObject: {value: ''},
                browser: scriptData.jobData.browser,
                testType: scriptData.jobData.testType,
                scheduleDate: moment().format(AppConstants.DATE_FORMAT),
                isRecursiveCheck: scriptData.jobData.isRecursiveCheck,
                recursiveSelect: scriptData.jobData.recursiveSelect,
                result: [],
                userEmail: scriptData.userData.email,
                jobName: '',
                serverLocation: scriptData.jobData.serverLocation,
                isScriptedJob: true
            };

            for (let security of AppConstants.SECURITY_ARRAY) {

                if (scriptData.jobData.siteURL.includes(security.value)) {
                    jobObjectToInsert.siteObject.value = scriptData.jobData.siteURL.replace(security.value, '');
                    jobObjectToInsert.securityProtocol = security.value;
                    break;
                }

            }
            await Helpers.isJobCreated(jobObjectToInsert);
            console.log("jobObjectToInsert", jobObjectToInsert)
        } else {
            console.log("continue", scriptData.userData)
            continue;
        }

    }

    setTimeout(function() {
        Helpers.sendEmailToScriptedUsers(Helpers);
    }, 1000);

    console.log('--------------------------------------------------------------------------------');
}

module.exports = new RunAutomatedScript();
