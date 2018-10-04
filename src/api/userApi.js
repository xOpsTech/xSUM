import fetchRequests from './fetchRequests.js';

class userApi {
    static registerUser(webserviceUrl, userObj) {
        return fetchRequests.postRequest(webserviceUrl, userObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static loginUser(webserviceUrl, userObj) {
        return fetchRequests.postRequest(webserviceUrl, userObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

}

export default userApi;
