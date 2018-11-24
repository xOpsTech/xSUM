import fetchRequests from './fetchRequests.js';

class tenantApi {
    static getAllTenantsFrom(webserviceUrl, idObj) {
        return fetchRequests.postRequest(webserviceUrl, idObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }
}

export default tenantApi;
