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
        const { googleResponseSuccess, googleResponseFail } = this.props;
        return (
            <GoogleLogin
                clientId={AppConstants.GOOGLE_SIGN_IN_CLIENT_ID}
                className="google-login-btn form-control"
                onSuccess={googleResponseSuccess}
                onFailure={googleResponseFail}>
                <div class="google-btn">
                    <div class="google-icon-wrapper">
                        <img class="google-icon" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" />
                    </div>
                    <p class="btn-text"><b>Sign in with google</b></p>
                </div>
            </GoogleLogin>
        );
    }
}

GoogleLoginButton.propTypes = {
};

export default GoogleLoginButton;
