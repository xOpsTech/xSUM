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

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {};

        return initialState;
    }

    render() {
        const {loggedUserObj, viewHistory, addJob, siteLoad} = this.props;
        return (
            <nav className="nav-container navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand" href="#">
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
                <LoginContainer loggedUserObj={loggedUserObj}/>
            </nav>
        );
    }
}

NavContainer.propTypes = {
    loggedUserObj: PropTypes.object
};

export default NavContainer;
