var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./routes/router')
    config = require('./config/config');

var port = config.port;
var app = express();

app.use('/assets', express.static('../assets'));
app.use('/lib', express.static('../lib'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRouter);
app.listen(port);
