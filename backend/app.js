var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./routes/router'),
    config = require('./config/config')

var Helpers = require('./common/Helpers');
var AppConstants = require('./constants/AppConstants');
var RealtimeDataSync = require('./realtime-data/realtime-data-sync');

var port = config.PORT;
var app = express();

RealtimeDataSync.startDataSync(app);
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.header(
            'Access-Control-Allow-Methods',
            'PUT, POST, PATCH, DELETE, GET'
        );
        return res.status(200).json({});
    }
    next();
});
app.use('/assets', express.static('../assets'));
app.use('/scripts', express.static('./scripts'));
app.use('/one-time-results', express.static('./one-time-results'));
app.use('/lib', express.static('../lib'));
app.use('/sitespeed-result', express.static('./sitespeed-result'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRouter);
