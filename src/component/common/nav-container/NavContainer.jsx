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
        var initialState = {

        };

        return initialState;
    }

    render() {
        const {loggedUserObj, viewHistory} = this.props;
        return (
            <div className="nav-container">
                <img className="logo-nav-sm-img" src="./assets/img/logo.png"/>
                <button className="view-history" onClick={viewHistory}>
                    <span>View History</span>
                </button>
                <LoginContainer loggedUserObj={loggedUserObj}/>
            </div>
        );
    }
}

NavContainer.propTypes = {
    loggedUserObj: PropTypes.object
};

export default NavContainer;
