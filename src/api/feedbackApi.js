import fetchRequests from './fetchRequests.js';

class alertApi {
    static saveFeedback(webserviceUrl, feedbackObj) {
        return fetchRequests.postRequest(webserviceUrl, feedbackObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }
}

export default alertApi;
