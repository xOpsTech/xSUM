var nodemailer = require('nodemailer');
var AppConstants = require('../constants/AppConstants');
var AlertApi = require('../routes/api/alert-api');
var InfluxDB = require('../db/influxdb');
var MongoDB = require('../db/mongodb');
var request = require('request');
var crypto = require('crypto');
var moment = require('moment');

function Helpers(){};

exports.sendEmail = function(toMailAddress, subject, html, res) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: AppConstants.EMAIL_USERNAME,
            pass: AppConstants.EMAIL_PASSWORD
        }
    });

    var mailOptions = {
        from: AppConstants.EMAIL_USERNAME,
        to: toMailAddress,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            //res.send({message: AppConstants.RESPONSE_ERROR});
        } else {
            console.log('Email sent: ' + info.response);
            //res.send({message: AppConstants.RESPONSE_SUCCESS});
        }
    });
}

exports.sendEmailFrom = function(fromMailAddress, fromPassword, toMailAddress, subject, html, res) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: fromMailAddress,
            pass: fromPassword
        }
    });

    var mailOptions = {
        from: fromMailAddress,
        to: toMailAddress,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            //res.send({message: AppConstants.RESPONSE_ERROR});
        } else {
            console.log('Email sent: ' + info.response);
            //res.send({message: AppConstants.RESPONSE_SUCCESS});
        }
    });
}

exports.executePingJob = function(databaseName, jobObj, isOneTimeTest) {
    request({
        uri: jobObj.securityProtocol + jobObj.urlValue,
        method: 'GET',
        time: true
    }, (err, resp) => {
        if (resp) {
            console.log('Successfully executed the job : ', jobObj.jobId);
            var resultID = crypto.randomBytes(10).toString('hex');
            var tagsObj = { jobid: jobObj.jobId, resultID: resultID, executedTime:jobObj.currentDateTime };
            InfluxDB.insertData(databaseName, AppConstants.PING_RESULT_LIST, tagsObj, resp.timings);

            databaseName !== AppConstants.DB_NAME
                && AlertApi.sendEmailAsAlert(databaseName, jobObj, tagsObj.executedTime);
            databaseName !== AppConstants.DB_NAME
                && AlertApi.sendRecoveryAlert(databaseName, jobObj);

            if (isOneTimeTest) {
                var newValueObj = {
                    status: 'Done',
                    resultID: resultID
                };
                MongoDB.updateData(AppConstants.DB_NAME, AppConstants.DB_URL_LIST, {jobId: jobObj.jobId}, newValueObj);
            }

        } else if (err) {

            var resultID = crypto.randomBytes(10).toString('hex');
            var tagsObj = { jobid: jobObj.jobId, resultID: resultID, executedTime:jobObj.currentDateTime };

            obj = {
                socket: 0,
                lookup: 0,
                connect:0,
                response:0.000000000,
                end:0

            }
            InfluxDB.insertData(databaseName, AppConstants.PING_RESULT_LIST, tagsObj, obj);

            AlertApi.sendFailureAlert(databaseName, jobObj);

        }

    })
}

exports.getJobsWithLocations = async function(tenantID) {
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
            "SELECT * FROM " + dataTable + " where jobid='" + job.jobId + "' and time >= '" + backDate + "'"
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
    return listObj;
}

exports.getAJobWithLocation = async function(paramObj) {
    var queryObj = {jobId: paramObj.jobId};
    var jobsList = await MongoDB.getAllData(paramObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var job = jobsList[0];

    var dataTable = '';
    if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE) {
        dataTable = AppConstants.PERFORMANCE_RESULT_LIST;
    } else {
        dataTable = AppConstants.PING_RESULT_LIST;
    }

    var backDate = moment().subtract(1, 'days').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
    var jobResults = await InfluxDB.getAllDataFor(
        paramObj.tenantID,
        "SELECT * FROM " + dataTable + " where jobid='" + job.jobId + "' and time >= '" + backDate + "'"
    );

    job.result = jobResults;
    return job;
}

exports.roundValue = function(value, decimalPlaces) {
    let num = Math.pow(10, decimalPlaces);
    return Math.round(value * num) / num;
}
