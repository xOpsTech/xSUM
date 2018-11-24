import React, {Fragment} from 'react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import LeftNav from '../common/left-nav/LeftNav';
import alertApi from '../../api/alertApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './AlertListViewStyles.less';
/* eslint-enable no-unused-vars */

class AlertListView extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.updateAlertClick = this.updateAlertClick.bind(this);
        this.removeAlertClick = this.removeAlertClick.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);
        this.redirectToAddAlert = this.redirectToAddAlert.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Alerts - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});

            this.getAllAlerts(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

        this.setState({isLeftNavCollapse: UIHelper.getLeftState()});
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            isLeftNavCollapse: false,
            alertsData: []
        };

        return initialState;
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    getAllAlerts(loggedUserObj) {
        var urlToGetAlerts = Config.API_URL + AppConstants.ALERTS_GET_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_ALERT});
        alertApi.getAllAlertsFrom(urlToGetAlerts, {userEmail: loggedUserObj.email}).then((data) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                    alertsData: data.alertsData
                }
            );
        });
    }

    updateAlertClick(e, alertToUpdate, index) {
        e.preventDefault();

        UIHelper.redirectTo(AppConstants.ALERT_VIEW_ROUTE, {
            alertObj: JSON.stringify({alertID: alertToUpdate._id})
        });
    }

    removeAlertClick(e, alertToRemove) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.REMOVING_ALERT});
        var url = Config.API_URL + AppConstants.REMOVE_ALERT_API;
        alertApi.removeAlert(url, {alertId: alertToRemove._id}).then(() => {
            let arrayAfterRemove = this.state.alertsData.filter((alertObj) => {
                return alertObj._id !== alertToRemove._id;
            });
            delete alertToRemove._id;
            arrayAfterRemove.push(alertToRemove);
            this.setState({isLoading: false, loadingMessage: '', alertsData: arrayAfterRemove});
        });

    }

    redirectToAddAlert() {
        UIHelper.redirectTo(AppConstants.ALERT_VIEW_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            alertsData,
            loggedUserObj,
            isLeftNavCollapse
        } = this.state;

        const AlertList = () => {
            var activeAlertCount = 0;
            alertsData.map((alert) => {

                if (alert._id) {
                    activeAlertCount++;
                }

            });

            if (activeAlertCount > 0) {
                return (
                    <table className="table table-borderless" id="alert-list">
                        <thead>
                            <tr>
                                <th>Alert Name</th>
                                <th>Warning Threshold</th>
                                <th>Critical Threshold</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                alertsData.map((alert, i) => {

                                    if (alert._id) {
                                        return (
                                            <tr className="table-row" key={'siteDetail' + i}>
                                                <td className="table-cell">
                                                    <div className="form-group has-feedback label-div">
                                                        <label className="alert-label">
                                                            {alert.job.jobName}
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="form-group has-feedback label-div">
                                                        <label className="alert-label">
                                                            {Math.round(alert.warningThreshold)} seconds
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="form-group has-feedback label-div">
                                                        <label className="alert-label">
                                                            {Math.round(alert.criticalThreshold)} seconds
                                                        </label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        className={
                                                            'btn-primary form-control ' +
                                                            (alert._id ? 'button-inline' : ' add-button')
                                                        }
                                                        onClick={(e) => this.updateAlertClick(e, alert, i)}
                                                        title={
                                                            (alert._id ? 'Update' : 'Add')
                                                            + ' alert of ' + alert.job.siteObject.value
                                                        }>
                                                        <span
                                                            className={
                                                                'glyphicon button-icon' +
                                                                (
                                                                    alert._id
                                                                        ? ' glyphicon-edit'
                                                                        : ' glyphicon-plus'
                                                                )
                                                            }>
                                                        </span>
                                                    </button>
                                                    {
                                                        (alert._id)
                                                            ? <button
                                                                className="btn-danger
                                                                    form-control button-inline"
                                                                onClick={(e) => this.removeAlertClick(e, alert)}
                                                                title={
                                                                    'Remove alert of '
                                                                    + alert.job.siteObject.value
                                                                }>
                                                                <span
                                                                    className="glyphicon
                                                                        glyphicon-remove button-icon">
                                                                </span>
                                                             </button>
                                                            : null
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    } else {
                                        return null;
                                    }

                                })
                            }
                        </tbody>
                    </table>
                );
            } else {
                return null;
            }

        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav
                    selectedIndex={AppConstants.ALERT_LIST_VIEW_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              isFixedNav={true}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div className="site-edit-container">
                    <div className = {
                        'table-container-div ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                        <div className="row alert-list-wrap-div">
                            <AlertList/>
                            <div className="row add-test-section">
                                <div className="col-sm-2 table-button">
                                    <button
                                        className="btn btn-primary form-control button-all-caps-text add-button"
                                        onClick={this.redirectToAddAlert}>
                                        Add Alert
                                    </button>
                                </div>
                                <div className="col-sm-11"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

AlertListView.propTypes = {
};

export default AlertListView;
