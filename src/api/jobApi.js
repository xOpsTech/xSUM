import fetchRequests from './fetchRequests.js';

class jobApi {
    static getAllJobsFrom(webserviceUrl, idObj) {
        return fetchRequests.postRequest(webserviceUrl, idObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static addJob(webserviceUrl, jobObj) {
        return fetchRequests.postRequest(webserviceUrl, jobObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static removeJob(webserviceUrl, jobObj) {
        return fetchRequests.postRequest(webserviceUrl, jobObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }
}

export default jobApi;
