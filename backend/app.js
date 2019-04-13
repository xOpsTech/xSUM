var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./routes/router'),
    config = require('./config/config'),
    multer = require('multer'),
    cors = require('cors');
var Helpers = require('./common/Helpers');
var AppConstants = require('./constants/AppConstants');
var RealtimeDataSync = require('./realtime-data/realtime-data-sync');

var port = config.PORT;
var app = express();

RealtimeDataSync.startDataSync(app);

app.use('/assets', express.static('../assets'));
app.use('/scripts', express.static('./scripts'));
app.use('/lib', express.static('../lib'));
app.use('/sitespeed-result', express.static('./sitespeed-result'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRouter);
app.use(cors());
