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

    var userInsertObj = {
        email: userObj.email,
        password: '',
        isActive: false,
        tenants: [{
            tenantID: userObj.tenantID,
            role: userObj.role,
        }]
    };

    var queryObj = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.USER_LIST, queryObj);

    if (userData.length > 0) {
        res.send({message: AppConstants.USER_EXISTS});
    } else {
        await MongoDB.insertData(AppConstants.USER_LIST, userInsertObj);

        // Update tenant users array
        var queryToGetTenantObj = {_id: ObjectId(userObj.tenantID)};
        var tenantData = await MongoDB.getAllData(AppConstants.TENANT_LIST, queryToGetTenantObj);
        var userArray = tenantData[0].users;
        userArray.push({userID: userInsertObj._id});
        var tenantUpdateObj = {
            users: userArray
        };

        var queryToUpdateTenant = {_id: ObjectId(userObj.tenantID)};
        MongoDB.updateData(AppConstants.TENANT_LIST, queryToUpdateTenant, tenantUpdateObj);
        res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userInsertObj.email}});
    }
}

UserApi.prototype.updateUserData = async function(req, res) {
    var userObj = req.body;

    var queryObjToGetUsers = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.USER_LIST, queryObjToGetUsers);

    for (let tenant of userObj.tenants) {

        if (tenant.tenantID == userObj.tenantID) {
            tenant.role = userObj.role;
            break;
        }

    }

    var userUpdateObj = {
        email: userObj.email,
        tenants: userObj.tenants
    };

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
    delete userData[0].password;
    res.send(
        {
            message: AppConstants.RESPONSE_SUCCESS,
            user: userData[0]
        }
    );
}

UserApi.prototype.checkLoginData = function(req, res) {
    var userObj = req.body;
    var queryObj = {email: userObj.email};
    MongoDB.checkUserExists(AppConstants.USER_LIST, queryObj, userObj.password, res);
}

UserApi.prototype.removeUserData = async function(req, res) {
    var userObj = req.body;
    var queryToRemoveUser = {
        _id: ObjectId(userObj.userID)
    };

    // Get relevant tenant
    var queryToGetTenantObj = {_id: ObjectId(userObj.tenantID)};
    var tenantData = await MongoDB.getAllData(AppConstants.TENANT_LIST, queryToGetTenantObj);
    var userArray = tenantData[0].users;
    var arrayAfterRemove = [];

    // Remove user from tenant
    for (let user of userArray) {

        if (user.userID != userObj.userID) {
            arrayAfterRemove.push(user);
        }

    }

    // Update tenant with remaining user
    var queryTenantObj = {_id: ObjectId(userObj.tenantID)};
    var tenantUpdateObj = {
        users: arrayAfterRemove
    };

    MongoDB.updateData(AppConstants.TENANT_LIST, queryTenantObj, tenantUpdateObj);
    MongoDB.deleteOneData(AppConstants.USER_LIST, queryToRemoveUser, res);
}

UserApi.prototype.getUserList = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var userList = await MongoDB.getAllData(AppConstants.USER_LIST, queryObj);

    var userData = [];

    for (let user of userList) {
        delete user.password;
        userData.push(user);
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
