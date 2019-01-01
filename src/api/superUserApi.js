import fetchRequests from './fetchRequests.js';

class superUserApi {
    static addSuperUser(webserviceUrl, jobObj) {
        return fetchRequests.postRequest(webserviceUrl, jobObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }
}

export default superUserApi;
