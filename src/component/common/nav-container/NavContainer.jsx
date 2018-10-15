import React from 'react';
import PropTypes from 'prop-types';

import LoginContainer from '../login-container/LoginContainer';
import * as AppConstants from '../../../constants/AppConstants';
import * as UIHelper from '../../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './NavContainerStyles.less';
/* eslint-enable no-unused-vars */

class NavContainer extends React.Component {
    constructor(props) {
        super(props);

        this.navigateToSourceCode = this.navigateToSourceCode.bind(this);
        this.logoClick = this.logoClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {};

        return initialState;
    }

    navigateToSourceCode() {
        window.open(AppConstants.GIT_PROJECT_URL, '_blank');
    }

    logoClick(e) {
        e.preventDefault();

        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }
    }

    render() {
        const {loggedUserObj, viewHistory, addJob, siteLoad, isFixedNav} = this.props;
        return (
            <nav className={
                    'nav-container navbar navbar-expand-lg navbar-light bg-light '
                    + ((isFixedNav) ? 'fixed-nav-bar' : '')
                }>
                <a className="navbar-brand" onClick={this.logoClick}>
                    <img className="logo-nav-sm-img" src="./assets/img/logo.png"/>
                </a>
                {
                    (viewHistory)
                        ? <button className="view-history" onClick={viewHistory}>
                              <span>View History</span>
                          </button>
                        : null
                }
                {
                    (addJob)
                        ? <button className="view-history" onClick={addJob}>
                              <span>+ Add a job</span>
                          </button>
                        : null
                }
                {
                    (siteLoad)
                        ? <button className="view-history" onClick={siteLoad}>
                              <span>Site Load</span>
                          </button>
                        : null
                }
                {
                    (loggedUserObj)
                        ? <LoginContainer loggedUserObj={loggedUserObj}/>
                        : null
                }

                <div className="get-involved-container">
                    <img
                        className="get-involve-icon"
                        src="./assets/img/get-involve-img.png"
                        onClick={this.navigateToSourceCode}/>
                </div>
            </nav>
        );
    }
}

NavContainer.defaultProps = {
    isFixedNav: false
};

NavContainer.propTypes = {
    loggedUserObj: PropTypes.object,
    isFixedNav: PropTypes.boolean
};

export default NavContainer;
