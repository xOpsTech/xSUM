exports.DB_NAME   = 'xsum';

exports.DB_URL_LIST = 'urlList';
exports.DB_JOB_LIST = 'jobList';
exports.USER_LIST   = 'userList';
exports.ALERT_LIST   = 'alertList';
exports.TENANT_LIST   = 'tenantList';
exports.SUPER_USER_LIST = 'superUserList';

// InfluxDB Datatables
exports.PERFORMANCE_RESULT_LIST = 'pageLoadTime';
exports.PING_RESULT_LIST   = 'pingResults';

exports.RESPONSE_SUCCESS = 'Success';
exports.RESPONSE_ERROR = 'Error';

exports.USER_EXISTS = 'User already exists. Try with another email address';
exports.EMAIL_NOT_EXISTS = 'Email does not exists';
exports.EMAIL_AND_PASSWORD_NOT_MATCH = 'Email and password does not match';
exports.USER_INACTIVE = 'User account is not activated';
exports.SUPER_USER_EXISTS = 'User is already in the super user list';
exports.SUPER_USER_NON_EXISTS = 'User is not in super user list';
exports.POINT_NOT_ENOUGH_ERROR = 'You can\'t add anymore jobs. Please contact administrator for any help...';

exports.INFLUXDB_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

exports.EMAIL_USERNAME = 'xsum.xops@gmail.com';
exports.EMAIL_PASSWORD = 'xsum@9871az';

exports.EMAIL_WARNING_ALERT_COUNT  = 5;
exports.EMAIL_CRITICAL_ALERT_COUNT = 5;

exports.DEFAULT_POINTS_COUNT = 25000;

exports.TOTAL_MILLISECONDS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

// User roles
exports.SUPER_USER = 'super-user';
exports.ADMIN_ROLE = 'admin';
exports.CREATE_ROLE = 'create';
exports.VIEW_ROLE = 'read-only';

// Resources
exports.ANY_RESOURCE = 'any-resource';

exports.ACCESS_LIST = [
    { role: this.SUPER_USER, resource: this.ANY_RESOURCE, action: 'create:any', attributes: '*' },
    { role: this.SUPER_USER, resource: this.ANY_RESOURCE, action: 'read:any', attributes: '*' },
    { role: this.SUPER_USER, resource: this.ANY_RESOURCE, action: 'update:any', attributes: '*' },
    { role: this.SUPER_USER, resource: this.ANY_RESOURCE, action: 'delete:any', attributes: '*' },

    { role: this.ADMIN_ROLE, resource: this.ANY_RESOURCE, action: 'create:any', attributes: '*' },
    { role: this.ADMIN_ROLE, resource: this.ANY_RESOURCE, action: 'read:any', attributes: '*' },
    { role: this.ADMIN_ROLE, resource: this.ANY_RESOURCE, action: 'update:any', attributes: '*' },
    { role: this.ADMIN_ROLE, resource: this.ANY_RESOURCE, action: 'delete:any', attributes: '*' },

    { role: this.CREATE_ROLE, resource: this.ANY_RESOURCE, action: 'create:any', attributes: '*, !views' },
    { role: this.CREATE_ROLE, resource: this.ANY_RESOURCE, action: 'read:any', attributes: '*' },
    { role: this.CREATE_ROLE, resource: this.ANY_RESOURCE, action: 'update:any', attributes: '!views' },
    { role: this.CREATE_ROLE, resource: this.ANY_RESOURCE, action: 'delete:any', attributes: '!views' },

    { role: this.VIEW_ROLE, resource: this.ANY_RESOURCE, action: 'create:any', attributes: '!views' },
    { role: this.VIEW_ROLE, resource: this.ANY_RESOURCE, action: 'read:any', attributes: '*' },
    { role: this.VIEW_ROLE, resource: this.ANY_RESOURCE, action: 'update:any', attributes: '!views' },
    { role: this.VIEW_ROLE, resource: this.ANY_RESOURCE, action: 'delete:any', attributes: '!views' },
];

// Test types
exports.PERFORMANCE_TEST_TYPE = 'performace';
exports.PING_TEST_TYPE = 'ping';
