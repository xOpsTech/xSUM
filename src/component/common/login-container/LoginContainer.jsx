import React from 'react';
import PropTypes from 'prop-types';

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
        const {loggedUserObj} = this.props;
        const DropDownPopOver = (props) => {
            return(
                <Popover {...props} className="drop-down">
                    {props.children}
                </Popover>
            );
        };
        const LogOutPopOver = (
            <DropDownPopOver className="log-out-drop-down">
                <div className="row">
                    {
                        (loggedUserObj.profilePicPath)
                            ? <div className="col-xs-2 logged-user-img">
                                  <img className="profile-pic-img" src={loggedUserObj.profilePicPath}/>
                              </div>
                            : null
                    }
                    <div className="col-xs-10">
                        <div>
                            {UIHelper.toTitleCase(loggedUserObj.name)}
                        </div>
                        <div>
                            {loggedUserObj.email}
                        </div>
                    </div>
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
                        <img className="profile-icon" src="./assets/img/user-icon.png"/>
                    </button>
                </OverlayTrigger>
            </div>
        );
    }
}

LoginContainer.propTypes = {
    loggedUserObj: PropTypes.object
};

export default LoginContainer;
