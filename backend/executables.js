var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./routes/router')
    config = require('./config/config');

var CreateTenants = require('./executables/createInfluxTenants');
var UpdatePoints = require('./executables/updatePoints');
var UpdateJobs = require('./executables/updateJobs');

var port = config.PORT;
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRouter);
app.listen(port);

var commandArguments = process.argv.slice(2);

switch (commandArguments[0]) {
    case 'create-tenants':
        // Create Influx Tenants
        CreateTenants.createInfluxTenants();
        break;
    case 'update-points':
        // Update Points
        UpdatePoints.updatePointsInDatabase();
        break;
    case 'update-jobs':
        // Update Jobs
        UpdateJobs.updateJobsInDatabase();
        break;
    default:
        console.log('Nothing executed');
}
