const Influx = require('influx');
var AppConstants = require('../constants/AppConstants');
const influx = new Influx.InfluxDB({
    host: AppConstants.INFLUXDB_IP,
    database: 'xsum'
});

function InfluxDB(){};

InfluxDB.prototype.getAllData = function(query) {
    return influx.query(query);
}

InfluxDB.prototype.removeData = function(query) {
    influx.query(query);
}

InfluxDB.prototype.getAllDataFor = async function(query) {
    return new Promise((resolve) => {
        influx.query(query).then((result) => {
            resolve(result);
        }).catch((error) => {
            resolve(error);
        })
    });
}

module.exports = new InfluxDB();
