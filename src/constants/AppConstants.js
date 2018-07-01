export const API_URL = 'http://35.238.189.246:5000';

// Constants for Backend APIs
export const URL_INSERT_API = '/urlData?action=insertUrlData';
export const URL_GET_API = '/urlData?action=getUrlData';

// Constants for patterns
export const NAME_PATTERN       = /[A-Za-z\s]+$/;
export const EMAIL_PATTERN      = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const PASSWORD_PATTERN   = /.{6,}/;
export const EMPTY_TEXT_PATTERN = /^\s*$/;

export const URL_ID_COOKIE = 'urlId';
export const STORAGE_ID    = 'STORAGE_ID';

// Routes
export const SITELOAD_ROUTE = '/siteLoad';
export const LOGIN_ROUTE = '/login';

// URL status
export const URL_DONE_STATE = 'Done';
export const URL_NEW_STATE  = 'New';
