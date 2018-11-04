import React, {Fragment} from 'react';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import ErrorIconComponent from '../common/error-icon-component/ErrorIconComponent';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import LogoContainer from '../common/logo-container/LogoContainer';
import GoogleLoginButton from '../common/google-login-button/GoogleLoginButton';
import ForgotPassword from '../common/forgot-password/ForgotPassword';
import OneTimeTest from '../common/one-time-test/OneTimeTest';
import userApi from '../../api/userApi';

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
        this.loginCheck            = this.loginCheck.bind(this);
        this.signUpClick           = this.signUpClick.bind(this);
        this.googleResponseSuccess = this.googleResponseSuccess.bind(this);
        this.googleResponseFail    = this.googleResponseFail.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            email     : {value:'', error: {}},
            password  : {value:'', error: {}},
            isLogin   : false,
            loginError: {}
        };

        return initialState;
    }

    componentDidMount() {
        document.title = 'Login - xSum';
        document.getElementById("background-video").style.display = 'block';
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    loginCheck(e) {

        if(e.key == 'Enter') {
            e.preventDefault();

            const {email, password} = this.state;
            var undefinedCheck = !(email.error.hasError === undefined);
            var errorCheck = !(email.error.hasError);

            // Check form has errors
            if (undefinedCheck && errorCheck) {

                this.setState({isLogin: true});

                var url = AppConstants.API_URL + AppConstants.USER_CHECK_LOGIN_API;

                var userData = {
                    email   : email.value,
                    password: password.value
                };

                userApi.loginUser(url, userData).then((response) => {
                    this.setState({isLogin: false});

                    if (response.message === AppConstants.RESPONSE_SUCCESS) {
                        var userObject = JSON.stringify({
                            email: response.user.email
                        });
                        UIHelper.setCookie(
                            AppConstants.SITE_LOGIN_COOKIE, userObject, AppConstants.LOGIN_COOKIE_EXPIRES);
                        UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE, {});
                    } else {
                        this.setState({loginError: {hasError: true, name: response.message}});
                    }

                });
            } else {

                if(email.error.hasError === undefined) {
                    this.setState({
                        email: {
                            value: email.value,
                            error: {
                                hasError: true,
                                name: MessageConstants.EMAIL_ERROR
                            }
                        }
                    });
                }

            }

        }


    }

    signUpClick(e) {
        e.preventDefault();
        UIHelper.redirectTo(AppConstants.SIGN_UP_ROUTE, {});
    }

    googleResponseSuccess(response) {
        var basicProfile = response.getBasicProfile();
        var userObject = JSON.stringify({
            name: basicProfile.getName(),
            email: basicProfile.getEmail(),
            profilePicPath: basicProfile.getImageUrl()
        });
        UIHelper.setCookie(AppConstants.SITE_LOGIN_COOKIE, userObject, AppConstants.LOGIN_COOKIE_EXPIRES);
        UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE, {});
    }

    googleResponseFail(response) {
        alert('Error', response);
    }

    render() {
        const {isLogin, loginError, email, password} = this.state;

        // Google secret client id : pQMZvMj2I_sxM6t7HNLYLKr7
        return (
            <Fragment>
                <LogoContainer/>
                <div className="login-container-div">
                    <LoadingScreen isDisplay={isLogin} message={MessageConstants.LOGING_MESSAGE}/>
                    <h1 className="site-add-title">Login</h1>
                    <form
                        name="login-form"
                        method="post">
                        <div className={
                            'form-group has-feedback ' +
                            ((email.error.hasError !== undefined)
                                ? ((email.error.hasError) ? 'has-error' : 'has-success') : '')
                            }>
                            <input
                                value={email.value}
                                onChange={(e) => {
                                    this.handleChange(e, {
                                        email: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isEmailHasError(e.target.value),
                                                name: MessageConstants.EMAIL_ERROR
                                            }
                                        }
                                    });
                                }}
                                type="email"
                                className="form-control"
                                id="emailInput"
                                placeholder="EMAIL"/>
                            <ErrorIconComponent error={email.error}/>
                            <ErrorMessageComponent error={email.error}/>
                        </div>
                        <div className="form-group">
                            <input
                                value={password.value}
                                onChange={(e) => this.handleChange(e, {
                                    password: {
                                        value: e.target.value
                                    }
                                })}
                                type="password"
                                className="form-control"
                                id="passwordInput"
                                placeholder="Password"
                                onKeyPress={this.loginCheck}/>
                            <ForgotPassword/>
                        </div>
                        <ErrorMessageComponent error={loginError}/>
                        <GoogleLoginButton
                            googleResponseSuccess={this.googleResponseSuccess}
                            googleResponseFail={this.googleResponseFail}/>
                        {
                            // <div className="form-group">
                            //     <button
                            //         className="btn btn-primary form-control"
                            //         onClick={(e) => this.loginCheck(e)}>
                            //         Login
                            //     </button>
                            // </div>
                        }
                        <div className="form-group">
                            <button
                                className="btn btn-primary form-control button-all-caps-text"
                                onClick={(e) => this.signUpClick(e)}>
                                Create a new account
                            </button>
                        </div>
                    </form>
                </div>
                <div className="login-container-div">
                    <OneTimeTest/>
                </div>
            </Fragment>
        );
    }
}


export default Login;
