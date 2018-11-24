var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var crypto = require('crypto');
const bcrypt = require('bcryptjs');
var {ObjectId} = require('mongodb');

var TenantApi = require('./tenant-api');

function UserApi(){};

UserApi.prototype.handleUserData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "registerUserData":
            new UserApi().registerUserData(req, res);
            break;
        case "checkLoginData":
            new UserApi().checkLoginData(req, res);
            break;
        case "removeUserData":
            new UserApi().removeUserData(req, res);
            break;
        case "getUserList":
            new UserApi().getUserList(req, res);
            break;
        case "getUserRolesList":
            new UserApi().getUserRolesList(req, res);
            break;
        case "addInActiveUserData":
            new UserApi().addInActiveUserData(req, res);
            break;
        case "updateUserData":
            new UserApi().updateUserData(req, res);
            break;
        case "addEmailSettingsUserData":
            new UserApi().addEmailSettingsUserData(req, res);
            break;
        case "getUserData":
            new UserApi().getUserData(req, res);
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
        role: AppConstants.ADMIN_ROLE,
        isActive: true,
        tenants: []
    };

    var queryObj = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.USER_LIST, queryObj);

    if (userData.length > 0) {
        res.send({message: AppConstants.USER_EXISTS});
    } else {
        await MongoDB.insertData(AppConstants.USER_LIST, userInsertObj);
        var tenantObj = await TenantApi.insertTenantData(userInsertObj._id);

        var tenantsArray = userInsertObj.tenants;

        tenantsArray.push({tenantID: tenantObj._id, role: AppConstants.ADMIN_ROLE});
        var toUpdateTenantArray = {
            tenants: tenantsArray
        };
        MongoDB.updateData(AppConstants.USER_LIST, {_id: ObjectId(userInsertObj._id)}, toUpdateTenantArray);
        res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userInsertObj.email}});
    }

}

UserApi.prototype.addInActiveUserData = async function(req, res) {
    var userObj = req.body;

    userObj.password = '';

    var userInsertObj = {
        email: userObj.email,
        password: userObj.password,
        role: userObj.role,
        isActive: false
    };

    // var queryObj = {email: userObj.email};
    //
    // var queryObj = {email: userObj.email};
    // var userData = await MongoDB.getAllData(AppConstants.USER_LIST, queryObj);
    //
    // if (userData.length > 0) {
    //     res.send({message: AppConstants.USER_EXISTS});
    // } else {
    //     await MongoDB.insertData(AppConstants.USER_LIST, userInsertObj);
    //     var tenantObj = await TenantApi.insertTenantData(userInsertObj._id);
    //
    //     var tenantsArray = userInsertObj.tenants;
    //
    //     tenantsArray.push({tenantID: tenantObj._id, role: AppConstants.ADMIN_ROLE});
    //     var toUpdateTenantArray = {
    //         tenants: tenantsArray
    //     };
    //     MongoDB.updateData(AppConstants.USER_LIST, {_id: ObjectId(userInsertObj._id)}, toUpdateTenantArray);
    //     res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userInsertObj.email}});
    // }

    // MongoDB.insertUser(AppConstants.USER_LIST, queryObj, userInsertObj, res);
}

UserApi.prototype.updateUserData = async function(req, res) {
    var userObj = req.body;

    var userUpdateObj = {
        email: userObj.email,
        role: userObj.role
    };

    var queryObjToGetUsers = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.USER_LIST, queryObjToGetUsers);

    if (userData.length > 0) {
        var queryObj = {_id: ObjectId(userObj.id)};
        var existingUserData = await MongoDB.getAllData(AppConstants.USER_LIST, queryObj);

        if (existingUserData[0].email === userUpdateObj.email) {
            MongoDB.updateData(AppConstants.USER_LIST, queryObj, userUpdateObj);
            res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userUpdateObj.email}});
        } else {
            res.send({message: AppConstants.USER_EXISTS});
        }

    } else {
        var queryObj = {_id: ObjectId(userObj.id)};
        MongoDB.updateData(AppConstants.USER_LIST, queryObj, userUpdateObj);
        res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userUpdateObj.email}});
    }

}

UserApi.prototype.addEmailSettingsUserData = async function(req, res) {
    var userObj = req.body;
    var queryObj = {_id: ObjectId(userObj.id)};
    var userUpdateObj = {
        settingEmail: userObj.settingEmail,
        settingEmailPassword: userObj.settingPassword
    }
    MongoDB.updateData(AppConstants.USER_LIST, queryObj, userUpdateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userUpdateObj.email}});
}

UserApi.prototype.getUserData = async function(req, res) {
    var userObj = req.body;
    var queryObjToGetUsers = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.USER_LIST, queryObjToGetUsers);
    res.send(
        {
            message: AppConstants.RESPONSE_SUCCESS,
            user: {
                _id: userData[0]._id,
                email: userData[0].email,
                role: userData[0].role,
                isActive: userData[0].isActive,
                settingEmail: userData[0].settingEmail
            }
        }
    );
}

UserApi.prototype.checkLoginData = function(req, res) {
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
            role: userList[i].role,
            isActive: userList[i].isActive
        });
    }

    res.send({userData: userData});
}

UserApi.prototype.getUserRolesList = function(req, res) {
    var userRoles = [
        {
            type: AppConstants.ADMIN_ROLE
        },
        {
            type: AppConstants.CREATE_ROLE
        },
        {
            type: AppConstants.VIEW_ROLE
        }
    ];

    res.send({userRoles: userRoles});
}

function hashPassword(password) {
    return new Promise((resolve) => {
        bcrypt.hash(password, 10, (err, hash) => {
            resolve(hash);
        });
    });
}

module.exports = new UserApi();
