import React, {Fragment} from 'react';
import moment from 'moment';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import LeftNav from '../common/left-nav/LeftNav';
import alertApi from '../../api/alertApi';
import ModalContainer from '../common/modal-container/ModalContainer';

import * as AppConstants from '../../constants/AppConstants';
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

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Tests - xSum';
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
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,

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
        var urlToGetAlerts = AppConstants.API_URL + AppConstants.ALERTS_GET_API;

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

    updateAlertClick(e, alertToUpdate) {

        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.SAVE_ALERT});
        var {loggedUserObj} = this.state;
        alertToUpdate.email = loggedUserObj.email;

        var urlToSaveAlert = AppConstants.API_URL + AppConstants.SAVE_ALERT_API;
        alertApi.saveAlert(urlToSaveAlert, alertToUpdate).then((data) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                }
            );
        });

    }

    removeAlertClick(e, alertIdToRemove) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.REMOVING_ALERT});
        var url = AppConstants.API_URL + AppConstants.REMOVE_ALERT_API;
        jobApi.removeJob(url, {alertId: alertIdToRemove}).then(() => {
            // let arrayAfterRemove = this.state.alertsData.filter((siteObject) => {
            //     return siteObject.jobId !== jobIdToRemove;
            // });
            this.setState({isLoading: false, loadingMessage: ''});
        });

    }

    redirectToAddAlert() {
        UIHelper.redirectTo(AppConstants.ALERT_VIEW_ROUTE, {});
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            alertsData,
            loggedUserObj,
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav selectedIndex={2} isFixedLeftNav={true}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div className="site-edit-container">
                    {
                        (alertsData.length > 0)
                            ? <div className="tests-list">
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Job Name</th>
                                            <th>Response Timeout</th>
                                            <th>Warning Threshold</th>
                                            <th>Critical Threshold</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            alertsData.map((alert, i) => {
                                                return (
                                                    <tr className="table-row" key={'siteDetail' + i}>
                                                        <td className="table-cell">
                                                            <div className="form-group has-feedback job-name-input">
                                                                <input
                                                                    value={alert.job.jobName}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="jobNameInput"
                                                                    placeholder="JOB NAME"
                                                                    disabled/>
                                                            </div>
                                                        </td>
                                                        <td className="table-cell">
                                                            <div className="form-group has-feedback job-name-input">
                                                                <input
                                                                    value={Math.round(alert.meanAvg)}
                                                                    type="number"
                                                                    className="form-control"
                                                                    id="urlObjectInput"
                                                                    placeholder="ENTER WEBSITE URL"
                                                                    disabled/>
                                                            </div>
                                                        </td>
                                                        <td className="table-cell">
                                                            <div className="form-group has-feedback job-name-input">
                                                                <input
                                                                    value={Math.round(alert.warningThreshold)}
                                                                    onChange={(e) => {
                                                                        alertsData[i].warningThreshold = e.target.value;
                                                                        this.handleChange(e, {
                                                                            alertsData: alertsData
                                                                        });
                                                                    }}
                                                                    type="number"
                                                                    className="form-control"
                                                                    id="urlObjectInput"
                                                                    placeholder="ENTER WEBSITE URL"/>
                                                            </div>
                                                        </td>
                                                        <td className="table-cell">
                                                            <div className="form-group has-feedback job-name-input">
                                                                <input
                                                                    value={Math.round(alert.criticalThreshold)}
                                                                    onChange={(e) => {
                                                                        alertsData[i].criticalThreshold = e.target.value;
                                                                        this.handleChange(e, {
                                                                            alertsData: alertsData
                                                                        });
                                                                    }}
                                                                    type="number"
                                                                    className="form-control"
                                                                    id="urlObjectInput"
                                                                    placeholder="ENTER WEBSITE URL"/>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn-primary form-control button-inline"
                                                                onClick={(e) => this.updateAlertClick(e, alert)}
                                                                title={(alert._id ? 'Update' : 'Add') + ' alert of ' + alert.job.siteObject.value}>
                                                                <span
                                                                    className={
                                                                        'glyphicon button-icon' + (alert._id ? ' glyphicon-edit' : ' glyphicon-plus')
                                                                    }>
                                                                </span>
                                                            </button>
                                                            {
                                                                (alert._id)
                                                                    ? <button
                                                                        className="btn-danger form-control button-inline"
                                                                        onClick={(e) => this.removeAlertClick(e, alert._id)}
                                                                        title={'Remove alert of ' + alert.job.siteObject.value}>
                                                                        <span className="glyphicon glyphicon-remove button-icon"></span>
                                                                     </button>
                                                                    : null
                                                            }
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        }
                                    </tbody>
                                </table>
                            </div>
                            : null
                    }
                    <div className="row add-test-section">
                        <div className="col-sm-4"></div>
                        <div className="col-sm-4 add-test-text" onClick={this.redirectToAddAlert}>
                            <div className="row">
                                Add a alert
                            </div>
                            <div className="row">
                                <i className="plus-icon glyphicon glyphicon-plus"></i>
                            </div>
                        </div>
                        <div className="col-sm-4"></div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

AlertListView.propTypes = {
};

export default AlertListView;
