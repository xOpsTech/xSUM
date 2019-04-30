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
        var userData = {
            email: scriptData["Business Email"],
            password: "acc0unt@123",
            name: scriptData["First Name"] + " " + scriptData["Last Name"],
            title: scriptData["Title"],
            timeZone: scriptData["Time Zone"],
            location: scriptData["Country"],
            company: scriptData["Company"]
        };
        userData.isScriptedUser = true;
        userData.passTocken = userData.password;

        // Create user
        let isUserCreated = await Helpers.isUserCreated(userData, true);

        if (isUserCreated) {
            let jobObjectToInsert = {
                jobId: crypto.randomBytes(10).toString('hex'),
                tenantID: String(isUserCreated._id),
                siteObject: {value: ''},
                browser: "chrome",
                testType: AppConstants.ONE_TIME_TEST_TYPE,
                scheduleDate: moment().format(AppConstants.DATE_FORMAT),
                isRecursiveCheck: true,
                recursiveSelect: { "value": 600000, "textValue": "TEST FREQUENCY - 10 Minutes Intervals" },
                result: [],
                userEmail: userData.email,
                jobName: '',
                serverLocation: {
                    "locationid": 0,
                    "textValue": "USA",
                    "latitude": 36.778259,
                    "longitude": -119.417931
                },
                isScriptedJob: true
            };

            for (let security of AppConstants.SECURITY_ARRAY) {

                let siteURL = scriptData["Web"];
                if (siteURL.includes(security.value)) {
                    jobObjectToInsert.siteObject.value = siteURL.replace(security.value, '');
                    jobObjectToInsert.securityProtocol = security.value;
                    break;
                }

            }
            await Helpers.isJobCreated(jobObjectToInsert);
            console.log("jobObjectToInsert", jobObjectToInsert)
        } else {
            console.log("continue", userData)
            continue;
        }

    }

    setTimeout(function() {
        Helpers.sendEmailToScriptedUsers(Helpers);
    }, 25*60*60*1000); // Execute it after 25 hours

    console.log('--------------------------------------------------------------------------------');
}

module.exports = new RunAutomatedScript();
