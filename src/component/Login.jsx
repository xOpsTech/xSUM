import React from 'react';

import ErrorMessageComponent from './common/ErrorMessageComponent';
import LoadingScreen from './common/LoadingScreen';

import * as MessageConstants from '../constants/MessageConstants';
import * as AppConstants from '../constants/AppConstants';
import * as UIHelper from '../common/UIHelper';

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange  = this.handleChange.bind(this);
        this.loginClick    = this.loginClick.bind(this);

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

    render() {
        const {isLogin, error} = this.state;
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
                </form>
            </div>
        );
    }
}


export default Login;
