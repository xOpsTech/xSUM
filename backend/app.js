var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./routes/router')
    config = require('./config/config');

var Scheduler = require('./scheduler/scheduler');

var port = config.PORT;
var app = express();

app.use('/assets', express.static('../assets'));
app.use('/lib', express.static('../lib'));
app.use('/sitespeed-result', express.static('./sitespeed-result'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRouter);
app.listen(port);

// Start Scheduler
Scheduler.startScheduler();
