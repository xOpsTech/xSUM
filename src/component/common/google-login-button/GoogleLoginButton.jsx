import React from 'react';
import GoogleLogin from 'react-google-login';

import * as AppConstants from '../../../constants/AppConstants';
/* eslint-disable no-unused-vars */
import Styles from './GoogleLoginStyles.less';
/* eslint-enable no-unused-vars */

class GoogleLoginButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {googleResponseSuccess, googleResponseFail} = this.props;
        return (
            <GoogleLogin
                clientId={AppConstants.GOOGLE_SIGN_IN_CLIENT_ID}
                className="google-login-btn form-control"
                onSuccess={googleResponseSuccess}
                onFailure={googleResponseFail}>
                <span className="fa fa-google google-icon"></span>
                <span>Sign in with Google</span>
            </GoogleLogin>
        );
    }
}

GoogleLoginButton.propTypes = {
};

export default GoogleLoginButton;
