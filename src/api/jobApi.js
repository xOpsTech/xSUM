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

    static updateJob(webserviceUrl, jobObj) {
        return fetchRequests.postRequest(webserviceUrl, jobObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static startOrStopJob(webserviceUrl, jobObj) {
        return fetchRequests.postRequest(webserviceUrl, jobObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static getResult(webserviceUrl, jobObj, jobData) {
        return fetchRequests.postRequest(webserviceUrl, jobObj).then((response) => {

            if (jobData) {
                return new Promise((resolve) => {
                    response.json().then((DataObject) => {
                        var resultObj = {resposeObj: DataObject, jobData: jobData};
                        resolve(resultObj);
                    }).catch((error) => {
                        resolve(error);
                    });
                });
            } else {

                if (response.ok) {
                    return response.json();
                }

            }

            return Promise.reject(response);
        });
    }
}

export default jobApi;
