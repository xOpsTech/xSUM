var nodemailer = require('nodemailer');
var AppConstants = require('../constants/AppConstants');
var AlertApi = require('../routes/api/alert-api');
var InfluxDB = require('../db/influxdb');
var MongoDB = require('../db/mongodb');
var request = require('request');
var crypto = require('crypto');


function Helpers(){};

Helpers.prototype.sendEmail = function(toMailAddress, subject, html, res) {
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

Helpers.prototype.sendEmailFrom = function(fromMailAddress, fromPassword, toMailAddress, subject, html, res) {
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

Helpers.prototype.executePingJob = function(databaseName, jobObj, isOneTimeTest) {
    request({
        uri: jobObj.urlValue,
        method: 'GET',
        time: true
    }, (err, resp) => {
        if (resp) {
            console.log('Successfully executed the job : ', jobObj.jobId);
            var resultID = crypto.randomBytes(10).toString('hex');
            var tagsObj = { jobid: jobObj.jobId, resultID: resultID,executedTime:jobObj.currentDateTime };
            InfluxDB.insertData(databaseName, AppConstants.PING_RESULT_LIST, tagsObj, resp.timings);
            
            AlertApi.sendEmailAsAlert(databaseName, jobObj, tagsObj.executedTime);

            if (isOneTimeTest) {
                var newValueObj = {
                    status: 'Done',
                    resultID: resultID
                };
                MongoDB.updateData(AppConstants.DB_NAME, AppConstants.DB_URL_LIST, {jobId: jobObj.jobId}, newValueObj);
            }

        } else {
            console.log('Error in executing the job : ', jobObj.jobId);
        }

    })
}

module.exports = new Helpers();
