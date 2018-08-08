export const API_URL = 'http://xsum.xops.it:5000';

// Constants for Backend APIs
export const URL_INSERT_API = '/urlData?action=insertUrlData';
export const URL_GET_API = '/urlData?action=getUrlData';
export const URL_INSERT_LOGGED_USER_API = '/urlData?action=insertLoggedUserUrlData';
export const URL_GET_LOGGED_USER_URL_API = '/urlData?action=getLoggedUserUrlData';

export const JOB_INSERT_API = '/handleJobs?action=insertJob';
export const JOBS_GET_API = '/handleJobs?action=getAllJobs';
export const JOB_REMOVE_API = '/handleJobs?action=removeJob';
export const JOB_START_API = '/handleJobs?action=startorStopJob';

// Constants for patterns
export const URL_PATTERN       = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
export const EMAIL_PATTERN      = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const PASSWORD_PATTERN   = /.{6,}/;
export const EMPTY_TEXT_PATTERN = /^\s*$/;

export const URL_ID_COOKIE = 'urlId';
export const STORAGE_ID    = 'STORAGE_ID';

// Routes
export const SITEADD_ROUTE = '/siteAdd';
export const SITELOAD_ROUTE = '/siteLoad';
export const LOGIN_ROUTE = '/login';

// URL status
export const URL_DONE_STATE = 'Done';
export const URL_NEW_STATE  = 'New';

export const DATE_FORMAT = 'MMMM Do YYYY, h:mm:ss a';

export const BROWSER_ARRAY = [
    {value: 'Chrome', textValue: 'Chrome'},
    {value: 'Safari', textValue: 'Safari'},
    {value: 'FireFox', textValue: 'FireFox'}
];

export const RECURSIVE_EXECUTION_ARRAY = [
    {value: 1000*3600*24, textValue: 'Daily Execution'},
    {value: 1000*3600*24*7, textValue: 'Weekly Execution'},
    {value: 1000*3600*24*7*30, textValue: 'Monthly Execution'}
];
