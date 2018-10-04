import React, {Fragment} from 'react';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
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
        this.loginClick            = this.loginClick.bind(this);
        this.signUpClick           = this.signUpClick.bind(this);
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

    componentDidMount() {
        document.title = 'Login - xSum';
        document.getElementById("background-video").style.display = 'block';
    }

    handleChange(stateObj) {
        this.setState(stateObj);
    }

    loginClick(e) {
        e.preventDefault();

        this.setState({isLogin: true});
        this.setState({error: {}});

        var url = AppConstants.API_URL + AppConstants.USER_CHECK_LOGIN_API;

        var userData = {
            email   : email.value,
            password: password.value
        };

        userApi.loginUser(url, userData).then((response) => {
            this.setState({isLogin: false});
        });
    }

    signUpClick(e) {
        e.preventDefault();

        UIHelper.redirectTo(AppConstants.SIGN_UP_ROUTE, {});
    }

    googleResponseSuccess(response) {
        var basicProfile = response.getBasicProfile();
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify({
                    name: basicProfile.getName(),
                    email: basicProfile.getEmail(),
                    profilePicPath: basicProfile.getImageUrl()
                })
            });
    }

    googleResponseFail(response) {
        alert('Error', response);
    }

    render() {
        const {isLogin, error} = this.state;

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
                            <ForgotPassword/>
                        </div>
                        <ErrorMessageComponent error={error}/>
                        <GoogleLoginButton
                            googleResponseSuccess={this.googleResponseSuccess}
                            googleResponseFail={this.googleResponseFail}/>
                        {
                            // <div className="form-group">
                            //     <button
                            //         className="btn btn-primary form-control"
                            //         onClick={(e) => this.loginClick(e)}>
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
                    <OneTimeTest urlObject={{}}/>
                </div>
            </Fragment>
        );
    }
}


export default Login;
