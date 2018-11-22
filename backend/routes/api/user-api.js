var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var crypto = require('crypto');
const bcrypt = require('bcryptjs');
var {ObjectId} = require('mongodb');

function UserApi(){};

UserApi.prototype.handleUserData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "registerUserData":
            new UserApi().registerUserData(req, res);
            break;
        case "getUserData":
            new UserApi().getUserData(req, res);
            break;
        case "removeUserData":
            new UserApi().removeUserData(req, res);
            break;
        case "getUserList":
            new UserApi().getUserList(req, res);
            break;
        default:
            res.send("no data");
    }
}

UserApi.prototype.registerUserData = async function(req, res) {
    var userObj = req.body;

    userObj.password = await hashPassword(userObj.password);

    var userInsertObj = {
        email: userObj.email,
        password: userObj.password,
        role: AppConstants.ADMIN_ROLE
    };

    var queryObj = {email: userObj.email};

    MongoDB.insertUser(AppConstants.USER_LIST, queryObj, userInsertObj, res);
}

UserApi.prototype.getUserData = function(req, res) {
    var userObj = req.body;
    var queryObj = {email: userObj.email};
    MongoDB.checkUserExists(AppConstants.USER_LIST, queryObj, userObj.password, res);
}

UserApi.prototype.removeUserData = function(req, res) {
    var userObj = req.body;
    var queryToRemoveUser = {
        _id: ObjectId(userObj.userId)
    };
    MongoDB.deleteOneData(AppConstants.USER_LIST, queryToRemoveUser, res);
}

UserApi.prototype.getUserList = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var userList = await MongoDB.getAllData(AppConstants.USER_LIST, queryObj);

    var userData = [];

    for (var i = 0; i < userList.length; i++) {
        userData.push({
            email: userList[i].email,
            _id: userList[i]._id,
            role: userList[i].role
        });
    }

    res.send({userData: userData});
}

function hashPassword(password) {
    return new Promise((resolve) => {
        bcrypt.hash(password, 10, (err, hash) => {
            resolve(hash);
        });
    });
}

module.exports = new UserApi();
