import React, {Fragment} from 'react';
import moment from 'moment';
import AmCharts from '@amcharts/amcharts3-react';

import LeftNav from '../common/left-nav/LeftNav';
import NavContainer from '../common/nav-container/NavContainer';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import alertApi from '../../api/alertApi';

import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './AlertViewStyles.less';
/* eslint-enable no-unused-vars */

class AlertView extends React.Component {
    constructor(props) {
        super(props);

        this.saveAlrt      = this.saveAlrt.bind(this);
        this.getAllAlerts  = this.getAllAlerts.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);
        this.handleChange  = this.handleChange.bind(this);

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
            this.getAllAlerts(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            loggedUserObj: null,
            isLoading: false,
            loadingMessage: '',
            alertsData: [],
            selectedAlertData: null
        };

        return initialState;
    }

    getAllAlerts(loggedUserObj) {
        var urlToGetAlerts = AppConstants.API_URL + AppConstants.ALERTS_GET_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_ALERT});
        alertApi.getAllAlertsFrom(urlToGetAlerts, {userEmail: loggedUserObj.email}).then((data) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                    alertsData: data.alertsData,
                    selectedAlertData: data.alertsData[0]
                }
            );
        });
    }

    saveAlrt(e) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.SAVE_ALERT});
        var {loggedUserObj, selectedAlertData} = this.state;
        selectedAlertData.email = loggedUserObj.email;

        var urlToSaveAlert = AppConstants.API_URL + AppConstants.SAVE_ALERT_API;
        alertApi.saveAlert(urlToSaveAlert, selectedAlertData).then((data) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                }
            );
        });

    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    render() {
        const {
            loggedUserObj,
            isLoading,
            loadingMessage,
            alertsData,
            selectedAlertData
        } = this.state;

        const JobNameDropDown = (props) => {

            if (alertsData.length === 0) {
                return (
                    <select  className="form-control form-group alert-drop-down">
                        <option>
                            No Jobs for you
                        </option>
                    </select>
                );
            } else {
                return (
                    <select
                        className="form-control form-group alert-drop-down"
                        onChange={(e) => this.dropDownClick(
                            {selectedAlertData: alertsData[e.target.value]})
                        }>
                        {
                            alertsData.map((alert, i) => {
                                return (
                                    <option key={'execution_' + i} value={i}>
                                        {alert.job.jobName}
                                    </option>
                                );
                            })
                        }
                    </select>
                );
            }

        };

        return (
            <Fragment>
                {
                    (loggedUserObj)
                        ? <NavContainer
                                  loggedUserObj={loggedUserObj} isFixedNav={false}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav selectedIndex={2} isFixedLeftNav={false}/>
                <div className="alert-view">
                    <div className="row">
                        <div className="col-sm-9">
                            <h1 className="alert-title">Alerts</h1>
                        </div>
                        <div className="col-sm-3">
                            <img className="warning-icon" src="./assets/img/warning-icon.png"/>
                        </div>
                    </div>
                    <form
                        name="alert-add-form"
                        method="post">
                        <div className="row">
                            <div className="col-sm-5 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Test</label>
                                </div>
                            </div>
                            <div className="col-sm-7">
                                <div className="form-group">
                                    <JobNameDropDown/>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-5 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Response Timeout</label>
                                </div>
                            </div>
                            <div className="col-sm-7">
                                <div className="form-group">
                                    {
                                        (selectedAlertData)
                                            ? <input
                                                type="number"
                                                className="form-control"
                                                id="responseTimeoutInput"
                                                disabled
                                                value={Math.round(selectedAlertData.meanAvg * 1000) / 1000}/>
                                            : <input
                                                type="number"
                                                className="form-control"
                                                id="responseTimeoutInput"
                                                disabled
                                                value=""/>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-5 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Warning Threshold</label>
                                </div>
                            </div>
                            <div className="col-sm-7">
                                <div className="form-group">
                                    {
                                        (selectedAlertData)
                                            ? <input
                                                type="number"
                                                className="form-control"
                                                id="warningThresholdInput"
                                                value={Math.round(selectedAlertData.warningThreshold)}
                                                onChange={(e) => {
                                                    selectedAlertData.warningThreshold = e.target.value;
                                                    this.handleChange(e, selectedAlertData);
                                                }}/>
                                            : <input
                                                type="number"
                                                className="form-control"
                                                id="responseTimeoutInput"
                                                disabled
                                                value="0"/>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-5 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Critical Threshold</label>
                                </div>
                            </div>
                            <div className="col-sm-7">
                                <div className="form-group">
                                    {
                                        (selectedAlertData)
                                            ? <input
                                                type="number"
                                                className="form-control"
                                                id="criticalThresholdInput"
                                                value={Math.round(selectedAlertData.criticalThreshold)}
                                                onChange={(e) => {
                                                    selectedAlertData.criticalThreshold = e.target.value;
                                                    this.handleChange(e, selectedAlertData);
                                                }}/>
                                            : <input
                                                type="number"
                                                className="form-control"
                                                id="responseTimeoutInput"
                                                disabled
                                                value="0"/>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="form-group alert-button-div">
                            <button
                                className="btn btn-primary form-control button-all-caps-text alert-button"
                                onClick={(e) => this.saveAlrt(e)}
                                {...(alertsData.length === 0) && {disabled: true}}>
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </Fragment>
        );
    }
}

AlertView.propTypes = {
};

export default AlertView;
