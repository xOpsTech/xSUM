var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
        default:
            res.send("no data");
    }
}

UserApi.prototype.registerUserData = async function(req, res) {
    var userObj = req.body;

    userObj.password = await hashPassword(userObj.password);

    var userInsertObj = {
        email: userObj.email,
        password: userObj.password
    };

    var queryObj = {email: userObj.email};

    MongoDB.insertUser(AppConstants.USER_LIST, queryObj, userInsertObj, res);


    // const settings = await strapi.store({
    //   environment: '',
    //   type: 'plugin',
    //   name: 'users-permissions',
    //   key: 'advanced'
    // }).get();
    //
    // if (!settings.allow_register) {
    //   return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Auth.advanced.allow_register' }] }] : 'Register action is currently disabled.');
    // }
    //
    // const params = _.assign(ctx.request.body, {
    //   provider: 'local'
    // });
    //
    // // Password is required.
    // if (!params.password) {
    //   return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.password.provide' }] }] : 'Please provide your password.');
    // }
    //
    // // Throw an error if the password selected by the user
    // // contains more than two times the symbol '$'.
    // if (strapi.plugins['users-permissions'].services.user.isHashed(params.password)) {
    //   return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.password.format' }] }] : 'Your password cannot contain more than three times the symbol `$`.');
    // }
    //
    // // Retrieve root role.
    // const root = await strapi.query('role', 'users-permissions').findOne({ type: 'root' }, ['users']);
    // const users = root.users || [];
    //
    // // First, check if the user is the first one to register as admin.
    // const hasAdmin = users.length > 0;
    //
    // // Check if the user is the first to register
    // const role = hasAdmin === false ? root : await strapi.query('role', 'users-permissions').findOne({ type: 'public' }, []);
    //
    // if (!role) {
    //   return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.role.notFound' }] }] : 'Impossible to find the root role.');
    // }
    //
    // // Check if the provided identifier is an email or not.
    // const isEmail = emailRegExp.test(params.identifier);
    //
    // if (isEmail) {
    //   params.identifier = params.identifier.toLowerCase();
    // }
    //
    // params.role = role._id || role.id;
    // params.password = await strapi.plugins['users-permissions'].services.user.hashPassword(params);
    //
    // const user = await strapi.query('user', 'users-permissions').findOne({
    //   email: params.email
    // });
    //
    // if (user && user.provider === params.provider) {
    //   return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.email.taken' }] }] : 'Email is already taken.');
    // }
    //
    // if (user && user.provider !== params.provider && strapi.plugins['users-permissions'].config.advanced.unique_email) {
    //   return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.email.taken' }] }] : 'Email is already taken.');
    // }
    //
    // // Set the inactivation parameter
    // params.isActive = false;
    //
    // // Generate random token.
    // const activateToken = crypto.randomBytes(64).toString('hex');
    // params.activateHashCode = activateToken;
    //
    // try {
    //   const user = await strapi.query('user', 'users-permissions').create(params);
    //
    //   // Retrieve admininstrator email addresses
    //   var adminEmails = [];
    //
    //   for (var adminIndex in users) {
    //       var emailAddress = users[adminIndex].email;
    //       adminEmails.push(emailAddress);
    //   }
    //
    //   const hostingUrl = 'quest.engineering:8443';
    //
    //   const activationUrl = 'https://' + hostingUrl + '/user/activate/' + activateToken;
    //
    //   // Send email to administrators
    //   var emailBody = 'New user has been registered...<br>'
    //                       + 'Username: ' + params.username + '<br>'
    //                       + 'Email: ' + params.email + '<br>'
    //                       + '<a href="' + activationUrl + '" target="_blank">Click to Activate User</a><br>Thanks';
    //
    //   strapi.api.email.services.email.sendAdminMail(
    //       adminEmails,
    //       'New user registered in the system',
    //       '', // Empty text
    //       emailBody,
    //       []
    //   );
    //
    //   ctx.send({ ok: true });
    // } catch(err) {
    //   const adminError = _.includes(err.message, 'username') ? 'Auth.form.error.username.taken' : 'Auth.form.error.email.taken';
    //
    //   ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: adminError }] }] : err.message);
    // }
}

UserApi.prototype.getUserData = function(req, res) {
    var userObj = req.body;
    var queryObj = {email: userObj.email};
    MongoDB.checkUserExists(AppConstants.USER_LIST, queryObj, userObj.password, res);
}

UserApi.prototype.removeUserData = function(req, res) {
    var userObj = req.body;
    var queryToRemoveUser = {
        email: userObj.email
    };
    MongoDB.deleteOneData(AppConstants.USER_LIST, queryToRemoveUser, res);
}

function hashPassword(password) {
    return new Promise((resolve) => {
        bcrypt.hash(password, 10, (err, hash) => {
            resolve(hash);
        });
    });
}

module.exports = new UserApi();
