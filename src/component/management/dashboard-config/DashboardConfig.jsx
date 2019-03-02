import React, {Fragment} from 'react';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import ModalContainer from '../../common/modal-container/ModalContainer';
import ErrorMessageComponent from '../../common/error-message-component/ErrorMessageComponent';
import NavContainer from '../../common/nav-container/NavContainer';
import LeftNav from '../../common/left-nav/LeftNav';
import userApi from '../../../api/userApi';
import tenantApi from '../../../api/tenantApi';
import jobApi from '../../../api/jobApi';
import alertApi from '../../../api/alertApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './DashboardConfigStyles.less';
/* eslint-enable no-unused-vars */

class DashboardConfig extends React.Component {
    constructor(props) {
        super(props);

        this.saveSettingsClick  = this.saveSettingsClick.bind(this);
        this.redirectToAddUser  = this.redirectToAddUser.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.handleChange       = this.handleChange.bind(this);
        this.dropDownClick      = this.dropDownClick.bind(this);
        this.tenantDropDown     = this.tenantDropDown.bind(this);
        this.handlePointsChange = this.handlePointsChange.bind(this);
        this.modalOkClick       = this.modalOkClick.bind(this);
        this.getAllJobs         = this.getAllJobs.bind(this);
        this.getAllAlerts       = this.getAllAlerts.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Dashboard Configuration - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});

            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectLogin();
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
            tenantList: [],
            jobList: [],
            selectedTenant: {
                points: {totalPoints: '', error: {}},
                pointsRemain: 0,
                usedPoints: 0
            },
            selectedTenantIndex: 0,
            isModalVisible: false,
            modalTitle: '',
            jobNumValue: parseInt(AppConstants.NO_OF_JOBS_ARRAY[0].value)
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData, true);
    }

    getAllTenantsData(user, context) {
        UIHelper.getAllTenantsData(user, context, context.getAllAlerts, true);
    }

    getAllAlerts(loggedUserObj, selectedTenant, context) {
        var urlToGetAlerts = Config.API_URL + AppConstants.ALERTS_GET_API;

        var objToGetAlerts = {
            userEmail: loggedUserObj.email,
            tenantID: selectedTenant._id
        };
        alertApi.getAllAlertsFrom(urlToGetAlerts, objToGetAlerts).then((data) => {
            var alertThresholdsByJob = [];

            for (var alert of data.alertsData) {
                alertThresholdsByJob.push({
                    jobId: alert.job.jobId,
                    criticalThreshold: parseFloat(alert.criticalThreshold),
                    warningThreshold: parseFloat(alert.warningThreshold)
                });
            }

            this.setState({ alertData: alertThresholdsByJob });

        });
        UIHelper.getAllTenantsData(loggedUserObj, this, this.getAllJobs, true);
    }

    getAllJobs(loggedUserObj, selectedTenant, context) {
        var urlToGetJobs = Config.API_URL + AppConstants.JOBS_GET_API;

        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        var objectToRetrieve = {
            tenantID: selectedTenant._id
        };
        jobApi.getAllJobsFrom(urlToGetJobs, objectToRetrieve).then((data) => {
            context.setState({
                jobList: data,
                isLoading: false,
                loadingMessage: ''
            });
        });
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    saveSettingsClick(e) {
        e.preventDefault();

        var {selectedTenant, loggedUserObj, jobList} = this.state;

        if (jobList.length > 0) {
            let jobsToUpdate = [];

            for (let job of jobList) {

                // Check for undefined of isShow in job object
                jobsToUpdate.push({jobId: job.jobId, isShow: (job.isShow) ? job.isShow : false});
            }
            this.setState({isLoading: true, loadingMessage: MessageConstants.UPDATING_JOBS});

            var updateObject = {
                jobList: jobsToUpdate,
                tenantID: selectedTenant._id
            };

            var urlToUpdateJobs = Config.API_URL + AppConstants.JOBS_UPDATE_API;
            jobApi.updateJob(urlToUpdateJobs, updateObject).then((response) => {
                this.setState(
                    {
                        isLoading: false,
                        loadingMessage: ''
                    }
                );
            });
        } else if (selectedTenant.userList.length > parseInt(selectedTenant.userCountLimit)) {
            this.setState({isModalVisible: true, modalTitle: MessageConstants.CANT_UPDATE_USER_COUNT});
        } else {
            this.setState({isModalVisible: true, modalTitle: MessageConstants.CANT_UPDATE_POINTS});
        }

    }

    redirectToAddUser() {
        UIHelper.redirectTo(AppConstants.USER_VIEW_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    tenantDropDown(stateObject, selectedIndex) {
        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        let selectedTenant = {
            _id: stateObject.selectedTenant._id
        };
        this.getAllJobs(this.state.loggedUserObj, selectedTenant, this);
    }

    handlePointsChange(e, selectedTenant) {
        let newPoints = parseInt(e.target.value);
        let usedPoints = parseInt(selectedTenant.points.usedPoints);

        if (e.target.value !== '') {
            selectedTenant.points = {
                totalPoints: newPoints,
                pointsRemain: newPoints - usedPoints,
                usedPoints: usedPoints
            };
        } else {
            selectedTenant.points = {
                totalPoints: 0,
                pointsRemain: 0,
                usedPoints: usedPoints
            };
        }

        this.handleChange(e, {selectedTenant});
    }

    modalOkClick() {
        this.setState({isModalVisible: false, modalTitle: ''});
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isLeftNavCollapse,
            tenantList,
            jobList,
            selectedTenant,
            selectedTenantIndex,
            isModalVisible,
            modalTitle,
            jobNumValue
        } = this.state;

        const JobSelectorContainer = (props) => {
            const {job, index} = props;

            return (
                <div className="row">
                    <div className="col-sm-1 alert-label-column">
                        <div className="form-group">
                            <input className="form-check-input checkbox-style"
                                type="checkbox"
                                id="recursiveCheck"
                                checked={job.isShow}
                                onChange={
                                    (e) => {
                                        job.isShow = !job.isShow;
                                        this.handleChange(e, {jobList: jobList});
                                    }}/>
                        </div>
                    </div>
                    <div className="col-sm-11">
                        <div className="form-group label-text">
                            <label className="control-label">
                                {job.jobName} - {job.securityProtocol + job.siteObject.value}
                            </label>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <ModalContainer
                    modalType={AppConstants.ALERT_MODAL}
                    title={modalTitle}
                    okClick={this.modalOkClick}
                    isModalVisible={isModalVisible}/>
                <LeftNav
                    selectedIndex={AppConstants.DASHBOARD_CONFIG_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                    isSubSectionExpand={true}
                    subSectionIndex={AppConstants.MANAGEMENT_INDEX}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              isFixedNav={true}
                              tenantDropDown={this.tenantDropDown}/>
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
                            <h1 className="site-add-title">
                                Dashboard Configuration
                            </h1>
                        </div>

                        <div className="row alert-list-wrap-div settings-section">
                            <div className="row">
                                <div className="col-sm-3 alert-label-column section-head">
                                    <h4 className="site-add-title">
                                        Job Configuration
                                    </h4>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Number of Jobs (Visible in Dashboard)</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <div className="form-group">
                                        <select className="form-control form-control-sm form-group"
                                            value={jobNumValue}
                                            onChange={(e) => this.dropDownClick(
                                                {
                                                    jobNumValue: parseInt(e.target.value)
                                                })
                                            }>
                                            {
                                                AppConstants.NO_OF_JOBS_ARRAY.map((jobNum) => {
                                                    return <option key={'jobNum_' + jobNum.value} value={jobNum.value}>
                                                                {jobNum.textValue}
                                                           </option>;
                                                })
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-3 alert-label-column section-head">
                                    <h4 className="site-add-title">
                                        Job List
                                    </h4>
                                </div>
                            </div>

                            <div className="row">
                                {
                                    (jobList.length > 0)
                                        ? jobList.map((job, i) => {
                                            return (
                                                <JobSelectorContainer job={job} index={i}/>
                                            );
                                        })
                                        : <div className="empty-list-style">{MessageConstants.NO_TESTS_AVAILABLE}</div>
                                }

                            </div>
                        </div>

                        <div className="row alert-list-wrap-div settings-section">
                            {
                                (loggedUserObj.permissions && loggedUserObj.permissions.canUpdate)
                                    ? <div className="row">
                                        <div className="col-sm-4 alert-label-column">
                                        </div>
                                        <div className="col-sm-3 alert-label-column">
                                            <div className="form-group">
                                                <button
                                                    className="btn btn-primary form-control button-all-caps-text"
                                                    onClick={(e) => this.saveSettingsClick(e)}>
                                                    Save Settings
                                                </button>
                                            </div>
                                        </div>
                                     </div>
                                    : null
                            }
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

DashboardConfig.propTypes = {
};

export default DashboardConfig;
