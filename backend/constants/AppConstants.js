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
exports.POINT_NOT_ENOUGH_UPDATE_ERROR = 'You don\'t have points to update this job. Please contact administrator for any help...';
exports.USER_LIMIT_REACHED = 'You have reached to the user limit for this account. Please contact administrator for any help...';

exports.INFLUXDB_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

exports.EMAIL_USERNAME = 'xsum.xops@gmail.com';
exports.EMAIL_PASSWORD = 'xsum@9871az';

exports.ADMIN_EMAIL_USERNAME = 'admin@xsum.xops.it';
exports.ADMIN_EMAIL_PASSWORD = 'Fwx$HA!4JC7H58npenXHkH3xh$v%zW6w';
exports.ALERT_EMAIL_USERNAME = 'alerts@xsum.xops.it';
exports.ALERT_EMAIL_PASSWORD = 'kXC$ug6&2U&UHT8a*^@Q6mwz6HxAZ&V8';

exports.ADMIN_EMAIL_TYPE = 'admin';
exports.ALERT_EMAIL_TYPE = 'alert';

exports.EMAIL_WARNING_ALERT_COUNT  = 5;
exports.EMAIL_CRITICAL_ALERT_COUNT = 5;
exports.EMAIL_FAILURE_ALERT_COUNT = 5;

exports.DEFAULT_POINTS_COUNT = 25000;
exports.DEFAULT_USER_COUNT = 5;

exports.DEF_EMAIL_WARNING_ALERT_COUNT  = 5; // Default email alert count value
exports.DEF_EMAIL_CRITICAL_ALERT_COUNT = 5;
exports.DEF_EMAIL_FAILURE_ALERT_COUNT = 5;

exports.TOTAL_MILLISECONDS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

// User roles
exports.SUPER_USER = 'super-user';
exports.ADMIN_ROLE = 'admin';
exports.CREATE_ROLE = 'create';
exports.VIEW_ROLE = 'read-only';

// Socket related constants
exports.UPDATE_JOB_RESULTS = 'UpdateJobResults';

// Resources
exports.ANY_RESOURCE = 'any-resource';

// Result status
exports.NORMAL_STATUS   = 'normal';
exports.CRITICAL_STATUS = 'critical';
exports.WARNING_STATUS  = 'warning';

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
exports.SCRIPT_TEST_TYPE = 'script';

// Execution time frequencies
exports.RECURSIVE_EXECUTION_ARRAY = [
    {value: 1000*60*10}, //textValue: 'TEST FREQUENCY - 10 Minutes Intervals'
    {value: 1000*60} , //textValue: 'TEST FREQUENCY - One Minute Interval'
    {value: 1000*60*5}, //textValue: 'TEST FREQUENCY - 5 Minutes Intervals'
    {value: 1000*60*30}, //textValue: 'TEST FREQUENCY - 30 Minutes Intervals'
    {value: 1000*60*60}, //textValue: 'TEST FREQUENCY - 60 Minutes Intervals'
];
