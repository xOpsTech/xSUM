export const PRODUCT_NAME = 'xSUM';
export const GIT_PROJECT_URL = 'https://github.com/xOpsTech/xSumFE';
export const SITE_LOGIN_COOKIE = 'xSumCookie';
export const LOGIN_COOKIE_EXPIRES = 30;

// Constants for Backend APIs
export const URL_INSERT_API = '/urlData?action=insertUrlData';
export const URL_GET_API = '/urlData?action=getUrlData';
export const URL_INSERT_LOGGED_USER_API = '/urlData?action=insertLoggedUserUrlData';
export const URL_GET_LOGGED_USER_URL_API = '/urlData?action=getLoggedUserUrlData';

export const JOB_INSERT_API = '/handleJobs?action=insertJob';
export const JOBS_GET_API = '/handleJobs?action=getAllJobs';
export const JOBS_GET_WITH_RESULTS_API = '/handleJobs?action=getAllJobsWithResults';
export const JOB_REMOVE_API = '/handleJobs?action=removeJob';
export const JOB_START_API = '/handleJobs?action=startorStopJob';
export const JOB_UPDATE_API = '/handleJobs?action=updateJob';
export const GET_RESULT_API = '/handleResults?action=getResult';
export const GET_ALL_RESULTS_JOB_API = '/handleResults?action=getAllResultsForJob';

export const USER_ADD_API = '/userAuth?action=registerUserData';
export const USER_REMOVE_API = '/userAuth?action=removeUserData';
export const USER_CHECK_LOGIN_API = '/userAuth?action=checkLoginData';
export const GET_USER_LIST_API = '/userAuth?action=getUserList';
export const GET_USER_ROLES_API = '/userAuth?action=getUserRolesList';
export const ADD_USER_API = '/userAuth?action=addInActiveUserData';
export const UPDATE_USER_API = '/userAuth?action=updateUserData';
export const GET_USER_DATA_API = '/userAuth?action=getUserData';
export const ADD_EMAIL_SETTING_DATA_API = '/userAuth?action=addEmailSettingsUserData';
export const SET_EMAIL_PASSWORD_API = '/userAuth?action=setEmailPasswordData';

export const SAVE_ALERT_API = '/alert?action=saveAlert';
export const ALERTS_GET_API = '/alert?action=getAllAlerts';
export const REMOVE_ALERT_API = '/alert?action=removeAlert';

export const GET_TENANT_DATA_API = '/tenant?action=getAllTenantsData';
export const ADD_TENANT_EMAIL_SETTING_DATA_API = '/tenant?action=addTenantEmailData';
export const GET_TENANTS_WITH_USERS_API = '/tenant?action=getAllTenantsWithUsers';
export const GET_ALL_USERS_WITH_TENANTS_API = '/tenant?action=getAllUsersWithTenants';

export const RESPONSE_SUCCESS = 'Success';

// ModalTypes
export const CONFIRMATION_MODAL = 'CONFIRMATION_MODAL';
export const DATA_MODAL = 'DATA_MODAL';
export const RESULT_MODAL = 'RESULT_MODAL';

// Constants for patterns
export const NAME_PATTERN       = /[A-Za-z\s]+$/;
export const URL_PATTERN        = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
export const EMAIL_PATTERN      = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const PASSWORD_PATTERN   = /.{6,}/;
export const EMPTY_TEXT_PATTERN = /^\s*$/;

export const URL_ID_COOKIE          = 'urlId';
export const STORAGE_ID             = 'STORAGE_ID';
export const LEFTNAV_COLLAPSE_STATE = 'LEFTNAV_COLLAPSE';
export const SELECTED_TENANT_ID     = 'SELECTED_TENANT_ID';

// Routes
export const SITEADD_ROUTE = '/siteAdd';
export const SITELOAD_ROUTE = '/siteLoad';
export const LOGIN_ROUTE = '/login';
export const SIGN_UP_ROUTE = '/sign-up';
export const SITE_RESULT_ROUTE = '/resultView';
export const SITE_CHART_RESULT_ROUTE = '/resultChartView';
export const ALL_RESULT_VIEW_ROUTE = '/allResultView';
export const ALERT_VIEW_ROUTE = '/alertView';
export const TESTS_ROUTE = '/tests';
export const ALERT_LIST_VIEW_ROUTE = '/alertListView';
export const USER_MANAGMENT_ROUTE = '/userManagement';
export const GRANT_ACCESS_ROUTE = '/grantAccess';
export const TENANTS_ROUTE = '/tenants';
export const SETTINGS_ROUTE = '/user-settings';
export const ADD_USER_ROUTE = '/add-user';
export const USER_PROFILE_ROUTE = '/user-profile';

export const ALL_RESULT_VIEW_INDEX = 0;
export const TESTS_INDEX = 1;
export const ALERT_LIST_VIEW_INDEX = 2;
export const USER_MANAGMENT_INDEX = 3;
export const GRANT_ACCESS_INDEX = 4;
export const TENANTS_INDEX = 5;
export const SETTINGS_INDEX = 6;
export const USER_PROFILE_INDEX = 7;

export const NOT_AVAILABLE_TENANT_NAME = 'N/A';
export const NOT_AVAILABLE_EMAIL = 'N/A';

export const LEFT_NAV_TABS = [
    {
        index: ALL_RESULT_VIEW_INDEX,
        text: 'Dashboard',
        route: ALL_RESULT_VIEW_ROUTE
    },
    {
        index: TESTS_INDEX,
        text: 'Tests',
        route: TESTS_ROUTE
    },
    {
        index: ALERT_LIST_VIEW_INDEX,
        text: 'Alerts',
        route: ALERT_LIST_VIEW_ROUTE
    },
    {
        index: -1,
        text: 'Management',
        route: '',
        subSections: [
            {
                index: USER_PROFILE_INDEX,
                text: 'Profile',
                route: USER_PROFILE_ROUTE
            },
            {
                index: USER_MANAGMENT_INDEX,
                text: 'User Management',
                route: USER_MANAGMENT_ROUTE
            },
            // {
            //     index: GRANT_ACCESS_INDEX,
            //     text: 'Grant Access',
            //     route: GRANT_ACCESS_ROUTE
            // },
            {
                index: TENANTS_INDEX,
                text: 'Accounts',
                route: TENANTS_ROUTE
            },
            {
                index: SETTINGS_INDEX,
                text: 'Settings',
                route: SETTINGS_ROUTE
            }
        ]
    }
];

// URL status
export const URL_DONE_STATE = 'Done';
export const URL_NEW_STATE  = 'New';

export const DATE_FORMAT = 'MMMM Do YYYY, h:mm:ss a';
export const DATE_ONLY_FORMAT = 'MM/DD/YYYY';
export const TIME_ONLY_FORMAT = 'h:mm a';

export const BROWSER_ARRAY = [
    {value: 'chrome', textValue: 'CHROME'},
    {value: 'firefox', textValue: 'FIREFOX'}
];

export const PERFORMANCE_TEST_TYPE = 'performace';
export const PING_TEST_TYPE = 'ping';
export const TEST_TYPE_ARRAY = [
    {value: PING_TEST_TYPE, textValue: 'PING TEST'}
];

export const RECURSIVE_EXECUTION_ARRAY = [
    {value: 1000*60*10, textValue: 'TEST FREQUENCY - 10 Minute Intervals'},
    {value: 1000*3600*24, textValue: 'TEST FREQUENCY - 24 Hour Intervals'},
    {value: 1000*3600*24*7, textValue: 'TEST FREQUENCY - 7 Day Intervals'},
    {value: 1000*3600*24*7*30, textValue: 'TEST FREQUENCY - 30 Day Intervals'}
];

export const CHART_TYPES_ARRAY = [
    {value: 'min', textValue: 'Min Value Chart'},
    {value: 'max', textValue: 'Max Value Chart'},
    {value: 'mean', textValue: 'Mean Value Chart'},
    {value: 'median', textValue: 'Median Value Chart'}
];

export const GOOGLE_MAP_KEY = 'AIzaSyDhPAHLPNL3g8OwxNfcByP61j82ZWUwHkk';
export const GOOGLE_SIGN_IN_CLIENT_ID = '213770133867-g6ag2dqhv8ir52qoqsmgnuubc7ciq86h.apps.googleusercontent.com';

var worldDataProvider = {
    map: 'worldLow',
    getAreasFromMap: true
};

export const TARGET_SVG = 'M9,0C4.029,0,0,4.029,0,9s4.029,9,9,9s9-4.029,9-9S13.971,0,9,0z M9,15.93 c-3.83,0-6.93-3.1-6.93-6.93S5.17,2.07,9,2.07s6.93,3.1,6.93,6.93S12.83,15.93,9,15.93 M12.5,9c0,1.933-1.567,3.5-3.5,3.5S5.5,10.933,5.5,9S7.067,5.5,9,5.5 S12.5,7.067,12.5,9z';

export const MAP_CONTENT_DATA = {
    map: 'continentsLow',
    areas: [
        {
            id: 'africa',
            linkToObject: worldDataProvider,
            color: '#605675',
            passZoomValuesToTarget: true
        },
        {
            id: 'asia',
            linkToObject: worldDataProvider,
            color: '#a791b4',
            passZoomValuesToTarget: true
        },
        {
            id: 'australia',
            linkToObject: worldDataProvider,
            color: '#7f7891',
            passZoomValuesToTarget: true
        },
        {
            id: 'europe',
            linkToObject: worldDataProvider,
            color: '#9186a2',
            passZoomValuesToTarget: true
        },
        {
            id: 'north_america',
            linkToObject: worldDataProvider,
            color: '#868191',
            passZoomValuesToTarget: true
        },
        {
            id: 'south_america',
            linkToObject: worldDataProvider,
            color: '#8f7ea9',
            passZoomValuesToTarget: true
        }
    ]
};

export const SUPER_USER = 'super-user';
