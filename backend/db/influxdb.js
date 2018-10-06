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

module.exports = new InfluxDB();
