import fetchRequests from './fetchRequests.js';

class alertApi {
    static saveAlert(webserviceUrl, alertObj) {
        return fetchRequests.postRequest(webserviceUrl, alertObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static getAllAlertsFrom(webserviceUrl, idObj) {
        return fetchRequests.postRequest(webserviceUrl, idObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }
}

export default alertApi;
