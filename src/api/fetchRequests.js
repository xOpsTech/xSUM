import fetch from 'isomorphic-fetch';

class fetchRequests {
    static postRequest(url, postData) {
        return fetch(url, {
            body: JSON.stringify(postData), // must match 'Content-Type' header
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            headers: {
                'Access-Control-Allow-Origin': '*',
                'content-type': 'application/json'
            },
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // *client, no-referrer
        });
    }

    static getRequest(url) {
        return fetch(url);
    }
}

export default fetchRequests;
