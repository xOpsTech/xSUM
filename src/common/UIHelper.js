import createHashHistory from 'history/lib/createHashHistory';
import {useRouterHistory} from 'react-router';

// Redirect to login page
export function redirectTo(route) {
    useRouterHistory(createHashHistory)().push(route);
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
