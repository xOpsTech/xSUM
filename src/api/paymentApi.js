import fetchRequests from './fetchRequests.js';

class paymentApi {
    static getClientToken(webserviceUrl, idObj) {
        return fetchRequests.getRequest(webserviceUrl, idObj).then(response => {
            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static checkoutPayment(webserviceUrl, idObj) {
        return fetchRequests
            .postRequest(webserviceUrl, idObj)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }

                return Promise.reject(response);
            });
    }

    static getAllSubscriptions(webserviceUrl, idObj) {
        return fetchRequests
            .postRequest(webserviceUrl, idObj)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }

                return Promise.reject(response);
            });
    }
}

export default paymentApi;
