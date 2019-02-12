var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./routes/router')
    config = require('./config/config');
var Helpers = require('./common/Helpers');
var AppConstants = require('./constants/AppConstants');

const http = require("http");
const socketIo = require("socket.io");

var port = config.PORT;
var app = express();

const server = http.Server(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A User connected');

    var checkingTime = 60*1000*2; // Two minutes

    setInterval(async () => {
        var objectToSend = await Helpers.getJobsWithLocations(socket.handshake.query['selectedTenantID']);
        io.emit(AppConstants.UPDATE_JOB_RESULTS, objectToSend);
    }, checkingTime);

    socket.on("disconnect", () => console.log("A User disconnected"));
});

server.listen(port, () => {
    console.log('server is listening on port: ', port);
});

app.use('/assets', express.static('../assets'));
app.use('/lib', express.static('../lib'));
app.use('/sitespeed-result', express.static('./sitespeed-result'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRouter);
