const Influx = require('influx');
var config = require('../config/config');
const influx = new Influx.InfluxDB({
    host: config.INFLUXDB_IP,
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
