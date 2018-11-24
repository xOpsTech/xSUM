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
        this.redirectToAddJob     = this.redirectToAddJob.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);

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

            this.getAllJobs(loggedUserObject);
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
            isLeftNavCollapse: false
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

    getAllJobs(loggedUserObj) {
        var url = Config.API_URL + AppConstants.JOBS_GET_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        jobApi.getAllJobsFrom(url, {userEmail: loggedUserObj.email}).then((data) => {
            this.setState({siteList: data, isLoading: false, loadingMessage: ''});
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

        this.setState({isLoading: true, loadingMessage: MessageConstants.REMOVING_A_JOB});
        var url = Config.API_URL + AppConstants.JOB_REMOVE_API;
        jobApi.removeJob(url, {jobId: jobIdToRemove}).then(() => {
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
                              isFixedNav={true}/>
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
                        <div className="row alert-list-wrap-div">
                            {
                                (siteList.length > 0)
                                    ? <table className="table table-borderless">
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
                                                                <div className="form-group has-feedback label-div">
                                                                    <label className="alert-label">
                                                                        {site.jobName}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="form-group has-feedback label-div">
                                                                    <label className="alert-label">
                                                                        {site.siteObject.value}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="form-group has-feedback label-div">
                                                                    <label className="alert-label">
                                                                        {site.browser}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="form-group has-feedback label-div">
                                                                    <label className="alert-label">
                                                                        {site.recursiveSelect.textValue}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn-primary form-control button-inline"
                                                                    onClick={(e) => this.updateJobClick(e, site)}
                                                                    title={'Update job of ' + site.siteObject.value}>
                                                                    <span
                                                                        className="glyphicon
                                                                            glyphicon-edit button-icon">
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    className="btn-danger form-control button-inline"
                                                                    onClick={(e) => this.removeJobClick(e, site.jobId)}
                                                                    title={'Remove job of ' + site.siteObject.value}>
                                                                    <span
                                                                        className="glyphicon glyphicon-remove
                                                                            button-icon">
                                                                    </span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                : null
                            }
                            <div className="row add-test-section">
                                <div className="col-sm-2 table-button">
                                    <button
                                        className="btn btn-primary form-control button-all-caps-text add-button"
                                        onClick={this.redirectToAddJob}>
                                        Add Test
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

Tests.propTypes = {
};

export default Tests;
