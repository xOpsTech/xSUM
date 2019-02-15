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

var refArray = [];

io.on('connection', (socket) => {
    console.log('A User connected');

    var sentTenantID = socket.handshake.query['selectedTenantID'];

    var isTenantFound = refArray.find(function(refObject) {
        return (refObject.tenantID === sentTenantID);
    });

    if (!isTenantFound) {
        var checkingTime = 2*1000; // Two minutes
        var socketRef = setInterval(async () => {
            var objectToSend = await Helpers.getJobsWithLocations(sentTenantID);
            io.emit(AppConstants.UPDATE_JOB_RESULTS + sentTenantID, objectToSend);
        }, checkingTime);

        var objectOfSocket = {ref: socketRef, tenantID: sentTenantID, userCount: 1};

        refArray.push(objectOfSocket);
    } else {

        for (let refObj of refArray) {

            if (refObj.tenantID === sentTenantID) {
                refObj.userCount += 1;
            }

        }
    }

    socket.on("disconnect", () => {

        for (let refObj of refArray) {
            var socketTenant = socket.handshake.query['selectedTenantID'];

            if (refObj.tenantID === socketTenant) {
                refObj.userCount -= 1;

                if (refObj.userCount < 1) {
                    var arrayAfterRemove = refArray.filter(obj => obj.tenantID !== socketTenant);
                    refArray = arrayAfterRemove;
                    clearInterval(refObj.ref);
                    break;
                }

            }

        }
        console.log("A User disconnected")
    });
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
