import React, {Fragment} from 'react';
import moment from 'moment';
import AmCharts from '@amcharts/amcharts3-react';

import LeftNav from '../common/left-nav/LeftNav';
import NavContainer from '../common/nav-container/NavContainer';

import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './AlertViewStyles.less';
/* eslint-enable no-unused-vars */

class AlertView extends React.Component {
    constructor(props) {
        super(props);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Alert View - xSum';
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {

        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            loggedUserObj: null
        };

        return initialState;
    }

    render() {
        const {
            loggedUserObj
        } = this.state;

        return (
            <Fragment>
                {
                    (loggedUserObj)
                        ? <NavContainer
                                  loggedUserObj={loggedUserObj} isFixedNav={true}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <LeftNav selectedIndex={2}/>
                <div className="alert-view">
                    ABC
                </div>
            </Fragment>
        );
    }
}

AlertView.propTypes = {
};

export default AlertView;
