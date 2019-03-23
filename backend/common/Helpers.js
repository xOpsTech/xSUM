var nodemailer = require('nodemailer');
var AppConstants = require('../constants/AppConstants');
var AlertApi = require('../routes/api/alert-api');
var InfluxDB = require('../db/influxdb');
var MongoDB = require('../db/mongodb');
var request = require('request');
var crypto = require('crypto');
var moment = require('moment');
var cmd = require('node-cmd');
var fileSystem = require('file-system');

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

exports.sendEmailAs = function(toMailAddress, subject, html, emailType) {
    var sendingMail, sendingMailPassword;
    switch (emailType) {
        case AppConstants.ADMIN_EMAIL_TYPE:
            sendingMail = AppConstants.ADMIN_EMAIL_USERNAME;
            sendingMailPassword = AppConstants.ADMIN_EMAIL_PASSWORD;
            break;
        case AppConstants.ALERT_EMAIL_TYPE:
            sendingMail = AppConstants.ALERT_EMAIL_USERNAME;
            sendingMailPassword = AppConstants.ALERT_EMAIL_PASSWORD;
            break;
        default:
            sendingMail = '';
            sendingMailPassword = '';
            break;
    }
    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: sendingMail,
            pass: sendingMailPassword
        }
    });

    var mailOptions = {
        from: sendingMail,
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
            var tagsObj = { jobid: jobObj.jobId, resultID: resultID, executedTime: jobObj.currentDateTime };

            // Insert data for single user test
            databaseName === AppConstants.DB_NAME
                && InfluxDB.insertData(databaseName, AppConstants.PING_RESULT_LIST, tagsObj, resp.timings);

            // sendEmailAsAlert method calls the insert method to put results in influx db
            databaseName !== AppConstants.DB_NAME
                && AlertApi.sendEmailAsAlert(databaseName, jobObj, resp.timings, resultID, tagsObj);
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
            var tagsObj = { jobid: jobObj.jobId, resultID: resultID, executedTime: jobObj.currentDateTime };

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

exports.executeScriptJob = function(databaseName, collectionName, jobToExecute) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = jobToExecute.serverLocation.textValue;
    var locationLatitude = jobToExecute.serverLocation.latitude;
    var locationLongitude = jobToExecute.serverLocation.longitude;

    var curDateMilliSec = new Date().getTime();

    let scriptFilePath = 'scripts/tenantid-' + databaseName + '/jobid-' + jobToExecute.jobId;
    let fileName = '/script-1.js';

    fileSystem.mkdir(scriptFilePath, {recursive: true}, (err) => {

        if (err) {
            console.log('Error in creating directories' + scriptFilePath, err);
            throw err;
        } else {

            fileSystem.writeFile(scriptFilePath + fileName, jobToExecute.scriptValue, (err) => {
                if (err) {
                    console.log('Error in creating file' + fileName, err);
                    throw err;
                } else {

                    //Send process request to sitespeed
                    var commandStr = 'sudo docker run --shm-size=1g --rm -v' +
                        ' "$(pwd)":/sitespeed.io sitespeedio/sitespeed.io:8.7.5 --preScript ' + jobToExecute.scriptPath + ' -n 1' +
                        ' --influxdb.host ' + config.INFLUXDB_IP + ' --influxdb.port 8086 --influxdb.database ' + databaseName +
                        ' --browser ' + jobToExecute.browser +
                        ' --influxdb.tags "jobid=' + jobToExecute.jobId + ',resultID=' + resultID +
                        ',locationTitle=' + locationTitle + ',latitude=' + locationLatitude +
                        ',longitude=' + locationLongitude + ',curDateMilliSec=' + curDateMilliSec + '" ' +
                        jobToExecute.securityProtocol + jobToExecute.siteObject.value;
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
            });
        }

    });
}

exports.getJobsWithLocations = async function(tenantID, isNeedShowTest) {
    var queryObj;

    if (isNeedShowTest) {
        queryObj = {isShow: true, testType: {$ne: AppConstants.SCRIPT_TEST_TYPE}};
    } else {
        queryObj = {testType: {$ne: AppConstants.SCRIPT_TEST_TYPE}};
    }

    var jobsList = await MongoDB.getAllData(tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var locationsArr = [];

    for (let job of jobsList) {
        job.result = await this.getJobResultsBackDate(tenantID, job, false);

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

    job.result = await this.getJobResultsBackDate(paramObj.tenantID, job, false);
    return job;
}

exports.getJobResultsBackDate = async function(tenantID, job, isLimitLast) {
    var dataTable = '';
    if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE || job.testType === AppConstants.SCRIPT_TEST_TYPE) {
        dataTable = AppConstants.PERFORMANCE_RESULT_LIST;
    } else {
        dataTable = AppConstants.PING_RESULT_LIST;
    }

    var backDate = moment().subtract(1, 'days').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
    var queryToGetResults = "SELECT * FROM " + dataTable +
                            " where jobid='" + job.jobId + "' and time >= '" + backDate + "'" +
                            ((isLimitLast) ? " ORDER BY time DESC LIMIT 1" : "");
    var jobResults = await InfluxDB.getAllDataFor(
        tenantID,
        queryToGetResults
    );

    return jobResults;
}

exports.roundValue = function(value, decimalPlaces) {
    let num = Math.pow(10, decimalPlaces);
    return Math.round(value * num) / num;
}
