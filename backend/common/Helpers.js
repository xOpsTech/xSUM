var nodemailer = require('nodemailer');
var AppConstants = require('../constants/AppConstants');
var AlertApi = require('../routes/api/alert-api');
var InfluxDB = require('../db/influxdb');
var MongoDB = require('../db/mongodb');
var request = require('request');
var crypto = require('crypto');

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
        uri: jobObj.urlValue,
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
           
            AlertApi.sendFailureAlert(databaseName, jobObj);
            
        }

    })
}

exports.roundValue = function(value, decimalPlaces) {
    let num = Math.pow(10, decimalPlaces);
    return Math.round(value * num) / num;
}
