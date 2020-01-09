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


    static getALLAccountData(webserviceUrl){
        //alert('Hi')
        return fetchRequests.postRequest(webserviceUrl)
        .then(
            (response)=> {
                if(response.ok){
                    
                    return response.json();
                }
                return Promise.reject(response);
            }
        )
    }

    static saveTenant(webserviceUrl, alertObj) {
        return fetchRequests.getRequest(webserviceUrl, alertObj).then((response) => {
            console.log(response)
            if (response.ok) {
                alert('RESPONSE>OKS')
                return response.json();
            }

            // return Promise.reject(response);
        });
    }

    static removeTenant(webserviceUrl, alertObj) {
        return fetchRequests.postRequest(webserviceUrl, alertObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }
}

export default tenantApi;
