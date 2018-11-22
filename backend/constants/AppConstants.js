exports.DB_URL_LIST = 'urlList';
exports.DB_JOB_LIST = 'jobList';
exports.USER_LIST   = 'userList';
exports.ALERT_LIST   = 'alertList';

exports.RESPONSE_SUCCESS = 'Success';
exports.RESPONSE_ERROR = 'Error';

exports.USER_EXISTS = 'User already exists. Try with another email address';
exports.EMAIL_NOT_EXISTS = 'Email does not exists';
exports.EMAIL_AND_PASSWORD_NOT_MATCH = 'Email and password does not match';

exports.INFLUXDB_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

exports.EMAIL_USERNAME = 'xsum.xops@gmail.com';
exports.EMAIL_PASSWORD = 'xsum@9871az';

exports.EMAIL_WARNING_ALERT_COUNT  = 1;
exports.EMAIL_CRITICAL_ALERT_COUNT = 1;

// User roles
exports.ADMIN_ROLE = 'admin';
exports.CREATE_ROLE = 'create';
exports.VIEW_ROLE = 'view';

// Resources
exports.JOB_RESOURCE = 'job';

exports.ACCESS_LIST = [
    { role: this.ADMIN_ROLE, resource: this.JOB_RESOURCE, action: 'create:any', attributes: '*, !views' },
    { role: this.ADMIN_ROLE, resource: this.JOB_RESOURCE, action: 'read:any', attributes: '*' },
    { role: this.ADMIN_ROLE, resource: this.JOB_RESOURCE, action: 'update:any', attributes: '*, !views' },
    { role: this.ADMIN_ROLE, resource: this.JOB_RESOURCE, action: 'delete:any', attributes: '*' },

    { role: this.CREATE_ROLE, resource: this.JOB_RESOURCE, action: 'create:own', attributes: '*, !rating, !views' },
    { role: this.CREATE_ROLE, resource: this.JOB_RESOURCE, action: 'read:any', attributes: '*' },
    { role: this.CREATE_ROLE, resource: this.JOB_RESOURCE, action: 'update:own', attributes: '*, !rating, !views' },
    { role: this.CREATE_ROLE, resource: this.JOB_RESOURCE, action: 'delete:own', attributes: '*' }
];
