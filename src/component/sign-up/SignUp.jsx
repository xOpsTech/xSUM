import React, {Fragment} from 'react';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import ErrorIconComponent from '../common/error-icon-component/ErrorIconComponent';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import userApi from '../../api/userApi';
import NavContainer from '../common/nav-container/NavContainer';
import ForgotPassword from '../common/forgot-password/ForgotPassword';

import * as MessageConstants from '../../constants/MessageConstants';
import * as Config from '../../config/config';
import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './SignUpStyles.less';
/* eslint-enable no-unused-vars */

class SignUp extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange        = this.handleChange.bind(this);
        this.signUpClick         = this.signUpClick.bind(this);
        this.termsOfServiceClick = this.termsOfServiceClick.bind(this);
        this.privacyPolicyClick  = this.privacyPolicyClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {

        var initialState = {
            isSignup        : false,
            regError        : {},
            email           : {value:'', error: {}},
            name            : {value:'', error: {}},
            company         : {value:'', error: {}},
            title           : {value:'', error: {}},
            location        : {value:'', error: {}},
            timeZone        : {value:'', error: {}},
            password        : {value:'', error: {}},
            confirmPassword : {value:'', error: {}},
        };

        return initialState;
    }

    componentDidMount() {
        document.title = 'Create Account - ' + AppConstants.PRODUCT_NAME;
    }

    handleChange(stateObj) {
        this.setState(stateObj);
    }

    passwordCheck(passwordText, confirmPasswordText) {
        var error;

        if (passwordText !== confirmPasswordText) {
            error = {
                hasError: true,
                name: MessageConstants.PASSWORD_CONFIRM_MATCH_ERROR
            };
            this.handleChange({
                password: {value: passwordText, error},
                confirmPassword: {value: confirmPasswordText, error}
            });
        } else {
            error = {
                hasError: UIHelper.isPasswordHasError(passwordText),
                name: MessageConstants.INVALID_PASSWORD_ERROR
            };
            this.handleChange({
                password: {value: passwordText, error},
                confirmPassword: {value: confirmPasswordText, error}
            });
        }

    }

    signUpClick(e) {
        e.preventDefault();

        const {email, password, confirmPassword, name, company, title, location, timeZone } = this.state;

        var undefinedCheck = !(email.error.hasError === undefined ||
                             password.error.hasError === undefined ||
                             confirmPassword.error.hasError === undefined);
        var errorCheck = !(email.error.hasError ||
                             password.error.hasError ||
                             confirmPassword.error.hasError);

        // Check form has errors
        if (undefinedCheck && errorCheck) {
            this.setState({isSignup: true});
            this.setState({error: {}});

            var url = Config.API_URL + AppConstants.USER_ADD_API;

            var userData = {
                email     : email.value,
                name      : name.value,
                company   : company.value,
                title     : title.value,
                location  : location.value,
                timeZone  : timeZone.value,
                password  : password.value
            };

            userApi.registerUser(url, userData).then((response) => {
                this.setState({isSignup: false});

                if (response.message === AppConstants.RESPONSE_SUCCESS) {
                    var userObject = JSON.stringify({
                        email: response.user.email
                    });
                    UIHelper.setCookie(AppConstants.SITE_LOGIN_COOKIE, userObject, AppConstants.LOGIN_COOKIE_EXPIRES);
                    UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE, {});
                } else {
                    this.setState({regError: {hasError: true, name: response.message}});
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

            if(name.error.hasError === undefined) {
                this.setState({
                    name: {
                        value: name.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.REQUIRED_FILED
                        }
                    }
                });
            }

            if(company.error.hasError === undefined) {
                this.setState({
                    company: {
                        value: company.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.REQUIRED_FILED
                        }
                    }
                });
            }

            if(title.error.hasError === undefined) {
                this.setState({
                    title: {
                        value: title.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.REQUIRED_FILED
                        }
                    }
                });
            }

            if(location.error.hasError === undefined) {
                this.setState({
                    location: {
                        value: location.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.REQUIRED_FILED
                        }
                    }
                });
            }

            if(timeZone.error.hasError === undefined) {
                this.setState({
                    timeZone: {
                        value: timeZone.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.REQUIRED_FILED
                        }
                    }
                });
            }

            if(password.error.hasError === undefined) {
                this.setState({
                    password: {
                        value: password.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.INVALID_PASSWORD_ERROR
                        }
                    }
                });
            }
        }

    }

    termsOfServiceClick(e) {
        e.preventDefault();
    }

    privacyPolicyClick(e) {
        e.preventDefault();
    }

    render() {
        const {email, name, company, title, location, timeZone, isSignup, regError, password, confirmPassword} = this.state;

        return (
            <Fragment>
                <NavContainer/>
                <div className="sign-up-container">
                    <LoadingScreen isDisplay={isSignup} message={MessageConstants.LOGING_MESSAGE}/>
                    <h1 id="create-account-title" className="site-add-title">Create Account</h1>
                    <form
                        name="login-form"
                        method="post">

                        <div className={
                            'form-group has-feedback email-input-div ' +
                            ((email.error.hasError !== undefined)
                                ? ((email.error.hasError) ? 'has-error' : 'has-success') : '')
                            }>
                            <input
                                value={email.value}
                                onChange={(e) => {
                                    this.handleChange({
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

                        <div className={
                                'form-group has-feedback ' +
                                ((name.error.hasError !== undefined)
                                    ? ((name.error.hasError) ? 'has-error' : 'has-success') : '')
                                }>
                            <input
                                type="text"
                                className="form-control"
                                id="nameInput"
                                onChange={(e) => {
                                    this.handleChange({
                                        name: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isNameHasError(e.target.value),
                                                name: MessageConstants.REQUIRED_FILED
                                            }
                                        }
                                    });
                                }}
                                placeholder="FULL NAME"/>
                            <ErrorIconComponent error={name.error}/>
                            <ErrorMessageComponent error={name.error}/>
                        </div>

                        <div className={
                                'form-group has-feedback ' +
                                ((company.error.hasError !== undefined)
                                    ? ((company.error.hasError) ? 'has-error' : 'has-success') : '')
                                }>
                            <input
                                type="text"
                                className="form-control"
                                id="companyInput"
                                onChange={(e) => {
                                    this.handleChange({
                                        company: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isNameHasError(e.target.value),
                                                name: MessageConstants.REQUIRED_FILED
                                            }
                                        }
                                    });
                                }}
                                placeholder="COMPANY"/>
                            <ErrorIconComponent error={company.error}/>
                            <ErrorMessageComponent error={company.error}/>
                        </div>

                        <div className={
                                'form-group has-feedback ' +
                                ((password.error.hasError !== undefined)
                                    ? ((password.error.hasError) ? 'has-error' : 'has-success') : '')
                                }>
                            <input
                                type="password"
                                className="form-control"
                                id="passwordInput"
                                value={password.value}
                                onChange={(e) => {
                                    this.passwordCheck(e.target.value, confirmPassword.value);
                                }}
                                placeholder="PASSWORD "/>
                            <ErrorIconComponent error={password.error}/>
                            <ErrorMessageComponent error={password.error}/>
                        </div>

                        <div className={
                                'form-group has-feedback ' +
                                ((confirmPassword.error.hasError !== undefined)
                                    ? ((confirmPassword.error.hasError) ? 'has-error' : 'has-success') : '')
                                }>
                            <input
                                type="password"
                                className="form-control"
                                id="passwordConfirmInput"
                                value={confirmPassword.value}
                                onChange={(e) => {
                                    this.passwordCheck(password.value, e.target.value);
                                }}
                                placeholder="CONFIRM PASSWORD"/>
                            <ErrorIconComponent error={confirmPassword.error}/>
                        </div>

                        <ErrorMessageComponent error={regError}/>
                        <div className="form-group">
                            <button
                                className="btn btn-primary form-control button-all-caps-text btn-register btn-register-primary"
                                onClick={(e) => this.signUpClick(e)}>
                                Register
                            </button>
                        </div>
                        <div className="form-group">
                            <button
                                className="btn btn-primary form-control half-button button-all-caps-text btn-register btn-register-secondary"
                                onClick={(e) => this.termsOfServiceClick(e)}>
                                Terms of Service
                            </button>
                            <button
                                className="btn btn-primary form-control half-button button-all-caps-text btn-register btn-register-secondary "
                                onClick={(e) => this.privacyPolicyClick(e)}>
                                Privacy Policy
                            </button>
                        </div>
                    </form>
                </div>
            </Fragment>
        );
    }
}


export default SignUp;
