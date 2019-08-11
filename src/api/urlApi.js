import fetchRequests from './fetchRequests.js';

class urlApi {
    static getUrlData(webserviceUrl, idObj) {
        return fetchRequests
            .postRequest(webserviceUrl, idObj)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }

                return Promise.reject(response);
            });
    }

    static setUrlData(webserviceUrl, urlObj) {
        return fetchRequests
            .postRequest(webserviceUrl, urlObj)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }

                return Promise.reject(response);
            });
    }

    static configRetensionPolicy(webserviceUrl, urlObj) {
        return fetchRequests
            .postRequest(webserviceUrl, urlObj)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }

                return Promise.reject(response);
            });
    }

    static getRetensionPolicyValue(webserviceUrl, urlObj) {
        return fetchRequests
            .postRequest(webserviceUrl, urlObj)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }

                return Promise.reject(response);
            });
    }
}

export default urlApi;
