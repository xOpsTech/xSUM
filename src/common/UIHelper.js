import createHashHistory from 'history/lib/createHashHistory';
import {useRouterHistory} from 'react-router';
import {randomBytes} from 'crypto';

import * as AppConstants from '../constants/AppConstants';

// Redirect to login page
export function redirectTo(route, data) {
    useRouterHistory(createHashHistory)().push({
        pathname: route,
        query: data
    });
}

// Cookies
export function setCookie(cname, cvalue, exmins) {
    var d = new Date();
    d.setTime(d.getTime() + (exmins * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();

    if (typeof document !== 'undefined') {
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    }

}

export function getCookie(cname) {
    var name = cname + '=';

    if (typeof document !== 'undefined') {
        var ca = document.cookie.split(';');

        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }

    }

    return '';
}

// Set local storage value
// Key and value are strings
export function setLocalStorageValue(key, value) {
    localStorage.setItem(key, value);
}

export function getLocalStorageValue(key) {
    return localStorage.getItem(key);
}

export function removeLocalStorageValue(key) {
    localStorage.removeItem(key);
}

export function toTitleCase(str) {

    if (str === undefined) {
        return '';
    } else {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

}

export function isUrlHasError(value) {
    return !RegExp(AppConstants.URL_PATTERN).test(value);
}

export function getRandomHexaValue() {
    return randomBytes(10).toString('hex');
}

export function replaceCharacter(stringToReplace, replace, replaceFrom) {
    return stringToReplace.replace(new RegExp(replace, 'g'), replaceFrom);
}
