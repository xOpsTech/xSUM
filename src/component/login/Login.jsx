import React from 'react';

import ErrorMessageComponent from '../common/ErrorMessageComponent';
import LoadingScreen from '../common/LoadingScreen';
import GoogleLogin from 'react-google-login';

import * as MessageConstants from '../../constants/MessageConstants';
import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './LoginStyles.less';
/* eslint-enable no-unused-vars */

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange          = this.handleChange.bind(this);
        this.loginClick            = this.loginClick.bind(this);
        this.googleResponseSuccess = this.googleResponseSuccess.bind(this);
        this.googleResponseFail    = this.googleResponseFail.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            emailValue   : '',
            passwordValue: '',
            isLogin      : false,
            error        : {}
        };

        return initialState;
    }

    handleChange(stateObj) {
        this.setState(stateObj);
    }

    loginClick(e) {
        e.preventDefault();

        this.setState({isLogin: true});
        this.setState({error: {}});

        //var {emailValue, passwordValue} = this.state;

        // var url = AppConstants.API_URL + AppConstants.USER_CHECK_API;
        //
        // var loginData = {
        //     identifier: emailValue,
        //     password  : passwordValue
        // };

        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE);

        /*userApi.login(url, loginData).then((response) => {
            this.setState({isLogin: false});

            if (response.ok) {

                // Pass logged user to next page
                response.json().then((data) => {
                    var loggedUser = data.user;
                    UIHelper.setCookie('username', loggedUser.username);
                    window.location = '/vertical-solution/vertical-solution';
                });

            } else {
                response.json().then((errorData) => {
                    this.setState({error: {hasError: true, name: errorData.message}});
                });
            }

        });*/

    }

    googleResponseSuccess(response) {
        var basicProfile = response.getBasicProfile();
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify({
                    name: basicProfile.getName(),
                    email: basicProfile.getEmail()
                })
            });
    }

    googleResponseFail(response) {
        console.log("EFG", response);
    }

    render() {
        const {isLogin, error} = this.state;

        // Google secret client id : pQMZvMj2I_sxM6t7HNLYLKr7
        return (
            <div className="root-container">
                <LoadingScreen isDisplay={isLogin} message={MessageConstants.LOGING_MESSAGE}/>
                <h1>Login</h1>
                <form
                    name="login-form"
                    method="post">
                    <div className="form-group">
                        <input
                            value={this.state.emailValue}
                            onChange={(e) => this.handleChange({emailValue: e.target.value})}
                            type="email"
                            className="form-control"
                            id="emailInput"
                            placeholder="Email"/>
                    </div>
                    <div className="form-group">
                        <input
                            value={this.state.passwordValue}
                            onChange={(e) => this.handleChange({passwordValue: e.target.value})}
                            type="password"
                            className="form-control"
                            id="passwordInput"
                            placeholder="Password"/>
                    </div>
                    <ErrorMessageComponent error={error}/>
                    <div className="form-group">
                        <button
                            className="btn btn-primary form-control"
                            onClick={(e) => this.loginClick(e)}>
                            Login
                        </button>
                    </div>
                    <GoogleLogin
                        clientId={'213770133867-g6ag2dqhv8ir52qoqsmgnuubc7ciq86h.apps.googleusercontent.com'}
                        className="google-login-btn form-control"
                        onSuccess={this.googleResponseSuccess}
                        onFailure={this.googleResponseFail}>
                        <span className="fa fa-google google-icon"></span>
                        <span>Sign in with Google</span>
                    </GoogleLogin>
                </form>
            </div>
        );
    }
}


export default Login;
