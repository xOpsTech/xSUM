import React, {Fragment} from 'react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import LeftNav from '../common/left-nav/LeftNav';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './TestStyles.less';
/* eslint-enable no-unused-vars */

class Tests extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.updateJobClick = this.updateJobClick.bind(this);
        this.removeJobClick = this.removeJobClick.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);
        this.redirectToAddJob = this.redirectToAddJob.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.tenantDropDown = this.tenantDropDown.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Tests - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});
            UIHelper.getUserData(loggedUserObject, this, this.getAllTenantsData);
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
            siteList : [],
            loggedUserObj: null,
            isLeftNavCollapse: false,
            selectedTenant: {userList: []}
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

    getAllTenantsData(user, context) {
        UIHelper.getAllTenantsData(user, context, context.getAllJobs);
    }

    getAllJobs(loggedUserObj, selectedTenant, context) {
        var url = Config.API_URL + AppConstants.JOBS_GET_API;
        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        var objectToRetrieve = {
            tenantID: selectedTenant._id
        };
        jobApi.getAllJobsFrom(url, objectToRetrieve).then((data) => {
            context.setState({siteList: data, isLoading: false, loadingMessage: ''});
        });
    }

    updateJobClick(e, jobToUpdate) {
        e.preventDefault();

        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE, {
            jobObj: JSON.stringify({jobID: jobToUpdate.jobId})
        });
    }

    removeJobClick(e, jobIdToRemove) {
        e.preventDefault();

        const {selectedTenant} = this.state;

        this.setState({isLoading: true, loadingMessage: MessageConstants.REMOVING_A_JOB});
        var url = Config.API_URL + AppConstants.JOB_REMOVE_API;
        var objectToRemove = {
            jobId: jobIdToRemove,
            tenantID: selectedTenant._id
        };
        jobApi.removeJob(url, objectToRemove).then(() => {
            let arrayAfterRemove = this.state.siteList.filter((siteObject) => {
                return siteObject.jobId !== jobIdToRemove;
            });
            this.setState({siteList: arrayAfterRemove, isLoading: false, loadingMessage: ''});
        });

    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    tenantDropDown(stateObject) {
        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        this.setState(stateObject);

        this.getAllJobs(this.state.loggedUserObj, stateObject.selectedTenant, this);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            siteList,
            loggedUserObj,
            isLeftNavCollapse
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav
                    selectedIndex={AppConstants.TESTS_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}/>
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
                <div>
                    <div className={
                        'table-container-div ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                        <div className="row alert-list-wrap-div table-responsive">
                            {
                                (siteList.length > 0)
                                    ? <table className="table table-striped table-dark">
                                        <thead>
                                            <tr>
                                                <th>Job Name</th>
                                                <th>Website URL</th>
                                                <th>Browser</th>
                                                <th>Test Frequency</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                siteList.map((site, i) => {
                                                    return (
                                                        <tr className="table-row" key={'siteDetail' + i}>
                                                            <td className="table-cell">
                                                                <div className="form-group has-feedback">
                                                                    <label>
                                                                        {site.jobName}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="form-group has-feedback">
                                                                    <label>
                                                                        {site.securityProtocol + site.siteObject.value}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="form-group has-feedback">
                                                                    <label>
                                                                        {site.browser}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="form-group has-feedback">
                                                                    <label>
                                                                        {site.recursiveSelect.textValue}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {
                                                                    (loggedUserObj.permissions
                                                                        && loggedUserObj.permissions.canCreate)
                                                                        ? <button
                                                                            className="btn-primary
                                                                                form-control"
                                                                            onClick={
                                                                                (e) =>
                                                                                    this.updateJobClick(e, site)
                                                                            }
                                                                            title={
                                                                                'Update job of ' + site.siteObject.value
                                                                            }>
                                                                            <span
                                                                                className="glyphicon
                                                                                    glyphicon-edit button-icon">
                                                                            </span>
                                                                          </button>
                                                                        : null
                                                                }

                                                                {
                                                                    (loggedUserObj.permissions
                                                                        && loggedUserObj.permissions.canUpdate)
                                                                        ? <button
                                                                            className="btn-danger
                                                                                form-control"
                                                                            onClick={
                                                                                (e) =>
                                                                                    this.removeJobClick(e, site.jobId)
                                                                            }
                                                                            title={
                                                                                'Remove job of ' + site.siteObject.value
                                                                            }>
                                                                            <span
                                                                                className="glyphicon glyphicon-remove
                                                                                    button-icon">
                                                                            </span>
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
                                : <div className="empty-list-style">No Tests available</div>
                            }
                            {
                                (loggedUserObj.permissions && loggedUserObj.permissions.canCreate)
                                    ? <div className="row add-test-section">
                                        <div className="col-sm-2 table-button">
                                            <button
                                                className="btn btn-primary form-control button-all-caps-text add-button"
                                                onClick={this.redirectToAddJob}>
                                                Add Test
                                            </button>
                                        </div>
                                        <div className="col-sm-11"></div>
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

Tests.propTypes = {
};

export default Tests;
