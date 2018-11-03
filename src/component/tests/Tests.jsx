import React, {Fragment} from 'react';
import moment from 'moment';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import LeftNav from '../common/left-nav/LeftNav';
import jobApi from '../../api/jobApi';
import ModalContainer from '../common/modal-container/ModalContainer';

import * as AppConstants from '../../constants/AppConstants';
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
        document.title = 'Tests - xSum';
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
        var url = AppConstants.API_URL + AppConstants.JOBS_GET_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        jobApi.getAllJobsFrom(url, {userEmail: loggedUserObj.email}).then((data) => {
            this.setState({siteList: data, isLoading: false, loadingMessage: ''});
        });
    }

    updateJobClick(e, jobToUpdate) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.UPDATING_A_JOB});
        var url = AppConstants.API_URL + AppConstants.JOB_UPDATE_API;
        jobApi.updateJob(url, {job: jobToUpdate}).then(() => {
            this.setState({isLoading: false, loadingMessage: ''});
        });

    }

    removeJobClick(e, jobIdToRemove) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.REMOVING_A_JOB});
        var url = AppConstants.API_URL + AppConstants.JOB_REMOVE_API;
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
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse})
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
                <LeftNav selectedIndex={1} isFixedLeftNav={true} leftNavStateUpdate={this.leftNavStateUpdate}/>
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
                <div>
                    {
                        (siteList.length > 0)
                            ? <div className={'table-container-div ' + ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                                <table className="table table-bordered">
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
                                                            <div className={
                                                                'form-group has-feedback job-name-input ' //+
                                                                // ((jobName.error.hasError !== undefined)
                                                                //     ? ((jobName.error.hasError) ? 'has-error' : 'has-success') : '')
                                                                }>
                                                                <input
                                                                    value={site.jobName}
                                                                    onChange={(e) => {
                                                                        siteList[i].jobName = e.target.value;
                                                                        this.handleChange(e, {
                                                                            siteList: siteList
                                                                        });
                                                                    }}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="jobNameInput"
                                                                    placeholder="JOB NAME"/>
                                                            </div>
                                                        </td>
                                                        <td className="table-cell">
                                                            <div className={
                                                                'form-group has-feedback job-name-input ' //+
                                                                // ((jobName.error.hasError !== undefined)
                                                                //     ? ((jobName.error.hasError) ? 'has-error' : 'has-success') : '')
                                                                }>
                                                                <input
                                                                    value={site.siteObject.value}
                                                                    onChange={(e) => {
                                                                        siteList[i].siteObject.value = e.target.value;
                                                                        this.handleChange(e, {
                                                                            siteList: siteList
                                                                        });
                                                                    }}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="urlObjectInput"
                                                                    placeholder="ENTER WEBSITE URL"/>
                                                            </div>
                                                        </td>
                                                        <td className="table-cell">
                                                            <select
                                                                className="form-control form-control-sm browser-select"
                                                                value={site.browser}
                                                                onChange={(e) => {
                                                                    siteList[i].browser = e.target.value;
                                                                    this.dropDownClick({
                                                                        siteList: siteList
                                                                    });
                                                                    //this.dropDownClick({browser: e.target.value})}
                                                                }}>
                                                                {
                                                                    AppConstants.BROWSER_ARRAY.map((browser, i) => {
                                                                        return <option key={'browser_' + i} value={browser.value}>
                                                                                    {browser.textValue}
                                                                                </option>;
                                                                        })
                                                                }
                                                            </select>
                                                        </td>
                                                        <td className="table-cell">
                                                            <select
                                                                disabled
                                                                className="form-control form-control-sm execution-time">
                                                                {
                                                                    AppConstants.RECURSIVE_EXECUTION_ARRAY.map((execution, i) => {
                                                                        return <option key={'execution_' + i} value={i}>
                                                                                    {execution.textValue}
                                                                                </option>;
                                                                        })
                                                                }
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn-primary form-control button-inline"
                                                                onClick={(e) => this.updateJobClick(e, site)}
                                                                title={'Update job of ' + site.siteObject.value}>
                                                                <span
                                                                    className="glyphicon glyphicon-edit button-icon">
                                                                </span>
                                                            </button>
                                                            <button
                                                                className="btn-danger form-control button-inline"
                                                                onClick={(e) => this.removeJobClick(e, site.jobId)}
                                                                title={'Remove job of ' + site.siteObject.value}>
                                                                <span className="glyphicon glyphicon-remove button-icon"></span>
                                                            </button>
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
                        <div className="col-sm-4 add-test-text" onClick={this.redirectToAddJob}>
                            <div className="row">
                                Add a test
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

Tests.propTypes = {
};

export default Tests;
