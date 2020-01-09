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

    static getUserList(webserviceUrl, userObj) {
        return fetchRequests.postRequest(webserviceUrl, userObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static removeUser(webserviceUrl, userObj) {
        return fetchRequests.postRequest(webserviceUrl, userObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

    static getUser(webserviceUrl, userObj) {
        console.log('userObj')
        return fetchRequests.postRequest(webserviceUrl, userObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }
    static getAccount(urlToGetUserAllAccount) {
        console.log('userApi')
            return fetchRequests.getRequest(urlToGetUserAllAccount)
            .then(
                (response)=>{
                console.log('userApi RESPONSE')
               // console.log(response.json())
                if (response.ok) {
                    console.log('Response is okay')
                    console.log('ss');
                   // console.log(Promise[[PromiseValue]])
                 console.log(response.json());
 
                }
    
               // return Promise.reject(response);
            })
    }




    static updateUser(webserviceUrl, userObj) {
        return fetchRequests.postRequest(webserviceUrl, userObj).then((response) => {

            if (response.ok) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

}

export default userApi;
