var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var Helpers = require('../../common/Helpers');
var crypto = require('crypto');
const bcrypt = require('bcryptjs');
var {ObjectId} = require('mongodb');
const AccessControl = require('accesscontrol');
const accessControl = new AccessControl(AppConstants.ACCESS_LIST);

var TenantApi = require('./tenant-api');

function SuperUserApi(){};

SuperUserApi.prototype.handleSuperUserData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "addSuperUserData":
            new SuperUserApi().addSuperUserData(req, res);
            break;
        case "getSuperUserData":
            new SuperUserApi().getSuperUserData(req, res);
            break;
        default:
            res.send("no data");
    }
}

SuperUserApi.prototype.addSuperUserData = async function(req, res) {
    var userObj = req.body;

    var queryObj = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.SUPER_USER_LIST, queryObj);

    if (userData.length > 0) {
        res.send({message: AppConstants.SUPER_USER_EXISTS});
    } else {
        var superUserInsertObj = {
            email: userObj.email
        };

        await MongoDB.insertData(AppConstants.DB_NAME, AppConstants.SUPER_USER_LIST, superUserInsertObj);
        res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: superUserInsertObj.email}});
    }

}

SuperUserApi.prototype.getSuperUserData = async function(req, res) {
    var userObj = req.body;

    var queryObj = {email: userObj.email};
    var superUserData = await getSuperUserDetails(AppConstants.DB_NAME, queryObj);

    if (superUserData) {
        res.send(superUserData);
    } else {
        res.send({message: AppConstants.SUPER_USER_NON_EXISTS});
    }

}

SuperUserApi.prototype.getSuperUserDetails = async function(databaseName, superUserDataObj) {
    var userData = await MongoDB.getAllData(databaseName, AppConstants.SUPER_USER_LIST, superUserDataObj);

    if (userData.length > 0) {
        return userData[0];
    } else {
        return undefined;
    }
}

module.exports = new SuperUserApi();
