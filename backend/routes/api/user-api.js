var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var Helpers = require('../../common/Helpers');
var crypto = require('crypto');
const bcrypt = require('bcryptjs');
var {ObjectId} = require('mongodb');
var SuperUserApi = require('./super-user-api');
const AccessControl = require('accesscontrol');
const accessControl = new AccessControl(AppConstants.ACCESS_LIST);
var moment = require('moment');
var multer = require('multer');
var cors = require('cors');

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
        case "setEmailPasswordData":
            new UserApi().setEmailPasswordData(req, res);
            break;
        case "updateProfile":
            new UserApi().updateProfile(req, res);
            break;
        case "uploadPicture":
            new UserApi().uploadPicture(req, res);
            break;
        case "deletePicture":
            new UserApi().deletePicture(req, res);
            break;
        default:
            res.send("no data");
    }
}

UserApi.prototype.registerUserData = async function(req, res) {

    var userObj = req.body;

    if (userObj.password) {
        userObj.password = await hashPassword(userObj.password);
    } else {
        userObj.password = '';
    }
    var userInsertObj = {
        email: userObj.email,
        name: userObj.name,
        company: userObj.company,
        title: userObj.title,
        location: userObj.location,
        timeZone:userObj.timeZone,
        password: userObj.password,
        timestamp: moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT),
        isActive: true,
        tenants: []
    };
    var queryObj = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

    if (userData.length > 0) {
        res.send({message: AppConstants.USER_EXISTS});
    } else {
        await MongoDB.insertData(AppConstants.DB_NAME, AppConstants.USER_LIST, userInsertObj);
        var tenantName = userObj.email.replace(/@.*$/,'') + '-account';
        var tenantObj = await TenantApi.insertTenantData(userInsertObj._id, tenantName);

        var tenantsArray = userInsertObj.tenants;

        tenantsArray.push({tenantID: tenantObj._id, role: AppConstants.ADMIN_ROLE});
        var toUpdateTenantArray = {
            tenants: tenantsArray
        };
        MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, {_id: ObjectId(userInsertObj._id)}, toUpdateTenantArray);

        // Insert user to tenant id database
        await MongoDB.insertData(String(tenantObj._id), AppConstants.USER_LIST, userInsertObj);
        InfluxDB.createDatabase(String(tenantObj._id));
        res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userInsertObj.email}});
    }

}

UserApi.prototype.addInActiveUserData = async function(req, res) {

    var userObj = req.body;

    var activationCode = crypto.randomBytes(30).toString('hex');
    var userPasswordBeforEncript = userObj.password;
    userObj.password = await hashPassword(userObj.password);

    var userInsertObj = {
        email: userObj.email,
        name: userObj.name,
        company: userObj.company,
        title: userObj.title,
        location: userObj.location,
        timeZone:userObj.timeZone,
        password: userObj.password,
        isActive: false,
        tenants: [{
            tenantID: userObj.tenantID,
            role: userObj.role,
        }],
        activationCode: activationCode
    };

    var queryToGetTenantObj = {_id: ObjectId(userObj.tenantID)};
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantObj);

    var queryObj = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

    var userCount = (tenantData[0].userCountLimit) ? tenantData[0].userCountLimit : AppConstants.DEFAULT_USER_COUNT;

    if (tenantData[0].users.length >= userCount) {
        res.send({message: AppConstants.USER_LIMIT_REACHED});
    } else if (userData.length > 0) {
        res.send({message: AppConstants.USER_EXISTS});
    } else {
        await MongoDB.insertData(userObj.tenantID, AppConstants.USER_LIST, userInsertObj);
        await MongoDB.insertData(AppConstants.DB_NAME, AppConstants.USER_LIST, userInsertObj);

        // Update tenant users array
        var userArray = tenantData[0].users;
        userArray.push({userID: userInsertObj._id});
        var tenantUpdateObj = {
            users: userArray
        };

        var queryToUpdateTenant = {_id: ObjectId(userObj.tenantID)};
        MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToUpdateTenant, tenantUpdateObj);

        var activateURL = userObj.siteURL + '/userAuth?action=activateUser&userID='
                          + userInsertObj._id + '&activationCode=' + activationCode
                          + '&tenantID=' + userObj.tenantID;

        // Send warning alert
        var emailBodyToSend =  'Administrator has invited you to join the ' + userObj.email + ' account on xSUM.<br>' +
                                'You can activate your account here. ' +
                                'If this link does not work try cutting and pasting the following link into your browser: <br>' +
                                '<a href="' + activateURL + '">' + activateURL + '</a> <br>' +
                                'Your temporary password is: <b>' + userPasswordBeforEncript + '<b> <br>';

        var queryToGetLoggedUser = {email: userObj.loggedUserEmail};
        var loggedUserData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryToGetLoggedUser);

        Helpers.sendEmailAs(
            userObj.email,
            'Welcome to xSUM',
            emailBodyToSend,
            AppConstants.ADMIN_EMAIL_TYPE
        );

        res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userInsertObj.email}});
    }
}

UserApi.prototype.updateUserData = async function(req, res) {

    var userObj = req.body;

    var queryObjToGetUsers = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObjToGetUsers);

    var userUpdateObj = {
        email: userObj.email
    };

    if (userData.length > 0) {
        for (let tenant of userData[0].tenants) {

            if (tenant.tenantID == userObj.tenantID) {
                tenant.role = userObj.role;
                break;
            }

        }
        userUpdateObj.tenants = userData[0].tenants;
    } else {
        for (let tenant of userObj.tenants) {

            if (tenant.tenantID == userObj.tenantID) {
                tenant.role = userObj.role;
                break;
            }

        }
        userUpdateObj.tenants = userObj.tenants;
    }

    if (userData.length > 0) {
        var queryObj = {_id: ObjectId(userObj.id)};
        var existingUserData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

        if (existingUserData[0].email === userUpdateObj.email) {
            MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj, userUpdateObj);
            MongoDB.updateData(userObj.tenantID, AppConstants.USER_LIST, queryObj, userUpdateObj);
            res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userUpdateObj.email}});
        } else {
            res.send({message: AppConstants.USER_EXISTS});
        }

    } else {
        var queryObj = {_id: ObjectId(userObj.id)};
        MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj, userUpdateObj);
        MongoDB.updateData(userObj.tenantID, AppConstants.USER_LIST, queryObj, userUpdateObj);
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
    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj, userUpdateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userUpdateObj.email}});
}

UserApi.prototype.setEmailPasswordData = async function(req, res) {
    var userObj = req.body;
    var queryObj = {_id: ObjectId(userObj.id)};
    var userUpdateObj = {
        emailPassword: userObj.emailPassword
    }
    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj, userUpdateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS});
}

UserApi.prototype.getUserData = async function(req, res) {
    var userObj = req.body;
    var queryObjToGetUsers = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObjToGetUsers);

    if (userData[0].emailPassword && (userData[0].emailPassword !== '')) {
        userData[0].isEmailPasswordSet = true;
    } else {
        userData[0].isEmailPasswordSet = false;
    }

    delete userData[0].password;
    delete userData[0].emailPassword;
    delete userData[0].activationCode;
    userData[0].permissions = {
        canCreate: accessControl.can(userData[0].tenants[0].role).createAny(AppConstants.ANY_RESOURCE).granted,
        canRead: accessControl.can(userData[0].tenants[0].role).readAny(AppConstants.ANY_RESOURCE).granted,
        canUpdate: accessControl.can(userData[0].tenants[0].role).updateAny(AppConstants.ANY_RESOURCE).granted,
        canDelete: accessControl.can(userData[0].tenants[0].role).deleteAny(AppConstants.ANY_RESOURCE).granted
    };

    // Get super user permissions
    userData[0].isSuperUser = (userData[0].tenants[0].role === AppConstants.SUPER_USER);

    res.send(
        {
            message: AppConstants.RESPONSE_SUCCESS,
            user: userData[0]
        }
    );
}

UserApi.prototype.checkLoginData = async function(req, res) {
    var userObj = req.body;
    var queryObj = {email: userObj.email};

    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

    if (userData.length > 0) {
        var storedPassword = userData[0].password;

        if (userData[0].isActive) {
            if (bcrypt.compareSync(userObj.password, storedPassword)) {
                res.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userData[0].email}});
            } else {
                res.send({message: AppConstants.EMAIL_AND_PASSWORD_NOT_MATCH});
            }
        } else {
            res.send({message: AppConstants.USER_INACTIVE});
        }


    } else {
        res.send({message: AppConstants.EMAIL_NOT_EXISTS});
    }
}

UserApi.prototype.removeUserData = async function(req, res) {
    var userObj = req.body;
    var queryToRemoveUser = {
        _id: ObjectId(userObj.userID)
    };

    // Get relevant tenant
    var queryToGetTenantObj = {_id: ObjectId(userObj.tenantID)};
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantObj);
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

    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryTenantObj, tenantUpdateObj);
    MongoDB.deleteOneData(userObj.tenantID, AppConstants.USER_LIST, queryToRemoveUser);
    MongoDB.deleteOneData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryToRemoveUser);
    res.send(queryToRemoveUser);
}

UserApi.prototype.getUserList = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var userList = await MongoDB.getAllData(userObj.tenantID, AppConstants.USER_LIST, queryObj);

    var userData = [];

    for (let user of userList) {
        delete user.password;
        delete user.emailPassword;
        delete user.activationCode;
        userData.push(user);
    }

    res.send({userData: userData});
}

UserApi.prototype.getUserRolesList = function(req, res) {
    var userRoles = [
        {
            type: AppConstants.SUPER_USER
        },
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

UserApi.prototype.handleUserGetData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "activateUser":
            new UserApi().activateUser(req, res);
            break;
        default:
            res.send("no data");
    }
}

UserApi.prototype.activateUser = async function(req, res) {
    var paramObj = req.query;

    var checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');

    if (checkForHexRegExp.test(paramObj.userID)) {
        var queryObj = {_id: ObjectId(paramObj.userID)};
        var userDataToActivate = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

        if (userDataToActivate.length > 0) {

            if (userDataToActivate[0].activationCode === paramObj.activationCode) {

                // Activate user
                var userUpdateObj = {
                    isActive: true,
                    activationCode: ''
                };
                var queryObj = {_id: ObjectId(paramObj.userID)};
                MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj, userUpdateObj);
                MongoDB.updateData(paramObj.tenantID, AppConstants.USER_LIST, queryObj, userUpdateObj);
                res.send("User is activated successful");
            } else {

                if (userDataToActivate[0].activationCode === '' && userDataToActivate[0].isActive) {
                    res.send("User is already activated");
                } else {
                    res.send("Can't activate user for given activation code");
                }

            }

        } else {
           res.send("Can't find user for given user id");
        }
    } else {
        res.send("User id is invalid");
    }

}

UserApi.prototype.updateProfile = async function(req, res) {
    var userObj = req.body;
    var queryObj = {_id: ObjectId(userObj._id)};
    var updateObj = {
        name: userObj.name,
        title: userObj.title,
        location: userObj.location,
        timeZone: userObj.timeZone,
        picture: userObj.picture
    };
    if (userObj.password) updateObj.password = await hashPassword(userObj.password);
    await MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj, updateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS});
}

UserApi.prototype.uploadPicture = async function(req, res) {
    var storage = multer.diskStorage({
          destination: function (req, file, cb) {
          cb(null, '../assets/img/filePicture')
        },
        filename: function (req, file, cb) {
          cb(null, file.originalname )
        }
    });
    var upload = multer({ storage: storage }).single('file');
    upload(req, res, function (err) {
       if (err instanceof multer.MulterError) {
           return res.status(500).json(err)
       } else if (err) {
           return res.status(500).json(err)
       }
       return res.status(200).send(req.file)
     })
}
UserApi.prototype.deletePicture = async function(req, res) {
    console.log(req.body);
    const fs = require('fs');
    fs.unlink("../assets/img/filePicture/" + req.body.name, function (err) {            
         if (err) {
             console.error(err);
         }
        console.log('File has been Deleted');
     });
}

module.exports = new UserApi();
