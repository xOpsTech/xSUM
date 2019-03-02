var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('../routes/router')
    config = require('../config/config');
var Helpers = require('../common/Helpers');
var AppConstants = require('../constants/AppConstants');

const http = require("http");
const socketIo = require("socket.io");

var port = config.PORT;

var tenantAndJobRefArray = [];
var tenantRefArray = [];

function RealtimeDataSync(){};

RealtimeDataSync.prototype.startDataSync = async function(app) {
    const server = http.Server(app);
    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('A User connected');

        var sentTenantID = socket.handshake.query['selectedTenantID'];
        var sentJobID = socket.handshake.query['selectedJobID'];

        if (sentTenantID && sentJobID) {
            manageSockets(socket, io, tenantAndJobRefArray, true, sentTenantID, sentJobID);
        } else {
            manageSockets(socket, io, tenantAndJobRefArray, false, sentTenantID);
        }

    });

    server.listen(port, () => {
        console.log('server is listening on port: ', port);
    });
}

async function manageSockets(socket, io, refArray, isTenantAndJob, sentTenantID, sentJobID) {

    var isObjFound = refArray.find(function(refObject) {

        if (isTenantAndJob) {
            return (refObject.tenantID === sentTenantID && refObject.jobID === sentJobID);
        } else {
            return (refObject.tenantID === sentTenantID);
        }

    });

    if (!isObjFound) {
        var checkingTime = 2*1000*60; // Two minutes
        var socketRef, objectOfSocket;

        if (isTenantAndJob) {
            socketRef = setInterval(async () => {
                var paramObj = {
                    tenantID: sentTenantID,
                    jobId: sentJobID
                }
                var objectToSend = await Helpers.getAJobWithLocation(paramObj);
                io.emit(AppConstants.UPDATE_JOB_RESULTS + sentTenantID + '_' + sentJobID, objectToSend);
            }, checkingTime);

            objectOfSocket = {ref: socketRef, tenantID: sentTenantID, jobID: sentJobID, userCount: 1};
        } else {
            socketRef = setInterval(async () => {
                var objectToSend = await Helpers.getJobsWithLocations(sentTenantID, false);
                io.emit(AppConstants.UPDATE_JOB_RESULTS + sentTenantID, objectToSend);
            }, checkingTime);

            objectOfSocket = {ref: socketRef, tenantID: sentTenantID, userCount: 1};
        }

        refArray.push(objectOfSocket);
    } else {

        for (let refObj of refArray) {

            if ((isTenantAndJob && refObj.tenantID === sentTenantID && refObj.jobID === sentJobID) ||
                (refObj.tenantID === sentTenantID)) {
                refObj.userCount += 1;
            }

        }
    }

    socket.on("disconnect", () => {

        for (let refObj of refArray) {

            if ((isTenantAndJob && refObj.tenantID === sentTenantID && refObj.jobID === sentJobID) ||
                (refObj.tenantID === sentTenantID)) {

                refObj.userCount -= 1;

                if (refObj.userCount < 1) {
                    var arrayAfterRemove = refArray.filter(obj => obj.tenantID !== sentTenantID);
                    refArray = arrayAfterRemove;
                    clearInterval(refObj.ref);
                    break;
                }

            }

        }
        console.log("A User disconnected")
    });

}

module.exports = new RealtimeDataSync();
