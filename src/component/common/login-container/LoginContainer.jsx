import React from 'react';

import {OverlayTrigger, Popover} from 'react-bootstrap';

import * as AppConstants from '../../../constants/AppConstants';
import * as UIHelper from '../../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './LoginStyles.less';
/* eslint-enable no-unused-vars */

class LoginContainer extends React.Component {
    constructor(props) {
        super(props);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            siteValue: '',
            browser  : '',
            error    : {},
            siteList : []
        };

        return initialState;
    }

    render() {
        const DropDownPopOver = (props) => {
            return(
                <Popover {...props} className="drop-down">
                    {props.children}
                </Popover>
            );
        };
        const LogOutPopOver = (
            <DropDownPopOver className="log-out-drop-down">
                <div>
                    FirstName LastName
                </div>
                <div>
                    {'emailAddress@email.com'}
                </div>
                <div className="divider"></div>
                <div className="logout-button-div">
                    <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                        className="btn btn-primary btn-sm log-out-drop-down--li--button">
                        Sign Out
                    </button>
                </div>
            </DropDownPopOver>
        );

        return (
            <div className="login-container">
                <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={LogOutPopOver}>
                    <button className="login-button">
                        <span className="first-name">First Name</span>
                        <i className="fa fa-user" aria-hidden="true"></i>
                    </button>
                </OverlayTrigger>
            </div>
        );
    }
}

LoginContainer.propTypes = {
};

export default LoginContainer;
