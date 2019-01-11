import React, { Fragment } from 'react';
import DateTimePicker from 'react-datetime-picker';
import moment from 'moment';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import LeftNav from '../common/left-nav/LeftNav';
import jobApi from '../../api/jobApi';
import ModalContainer from '../common/modal-container/ModalContainer';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './SiteAddStyles.less';
/* eslint-enable no-unused-vars */

class SiteAdd extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.onChangeDateTime = this.onChangeDateTime.bind(this);
        this.redirectToSiteLoad = this.redirectToSiteLoad.bind(this);
        this.recursiveCheckBoxClick = this.recursiveCheckBoxClick.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);
        this.addJobClick = this.addJobClick.bind(this);
        this.removeJobClick = this.removeJobClick.bind(this);
        this.startOrStopJobClick = this.startOrStopJobClick.bind(this);
        this.getAllJobs = this.getAllJobs.bind(this);
        this.viewResultJobClick = this.viewResultJobClick.bind(this);
        this.closeClick = this.closeClick.bind(this);
        this.viewResult = this.viewResult.bind(this);
        this.navigateToResultView = this.navigateToResultView.bind(this);
        this.tenantDropDown = this.tenantDropDown.bind(this);

        // Setting initial state objects
        this.state = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Site Add - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});
            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    getAllTenantsData(user, context) {
        UIHelper.getAllTenantsData(user, context, context.getAllJobs);
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            siteObject: { value: '', error: {} },
            browser: AppConstants.BROWSER_ARRAY[0].value,
            testType: AppConstants.TEST_TYPE_ARRAY[0].value,
            siteList: [],
            scheduleDate: new Date(),
            loggedUserObj: null,
            isRecursiveCheck: true,
            recursiveSelect: AppConstants.RECURSIVE_EXECUTION_ARRAY[0],
            isModalVisible: false,
            siteToResult: null,
            jobName: {value: '', error: {}},
            selectedJobID: null,
            selectedTenant: {userList: []},
            selectedLocationID: 0
        };

        return initialState;
    }

    onChangeDateTime(scheduleDate) {
        this.setState({ scheduleDate });
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    getAllJobs(loggedUserObj, selectedTenant, context) {
        var url = Config.API_URL + AppConstants.JOBS_GET_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        var objectToRetrieve = {
            tenantID: selectedTenant._id
        };
        jobApi.getAllJobsFrom(url, objectToRetrieve).then((data) => {

            if (this.props.location.query.jobObj) {
                var jobObj = JSON.parse(this.props.location.query.jobObj);

                for (let currentJobObj of data) {
                    if (jobObj.jobID === currentJobObj.jobId) {
                        var siteUrl = currentJobObj.siteObject.value.replace(/http:\/\//g, '');
                        context.setState(
                            {
                                siteObject: {
                                    value: siteUrl, // Remove http://
                                    error: {
                                        hasError: UIHelper.isUrlHasError(siteUrl),
                                        name: MessageConstants.URL_ERROR
                                    }
                                },
                                jobName: {
                                    value: currentJobObj.jobName,
                                    error: {
                                        hasError: UIHelper.isNameHasError(currentJobObj.jobName),
                                        name: MessageConstants.NAME_ERROR
                                    }
                                },
                                browser: currentJobObj.browser,
                                recursiveSelect: {
                                    value: currentJobObj.recursiveSelect.value,
                                    textValue: currentJobObj.recursiveSelect.textValue
                                },
                                selectedJobID: currentJobObj.jobId
                            }
                        );
                        break;
                    }

                }

            } else {
                UIHelper.getUserData(loggedUserObj, this, (user, context) => {
                    if (!user.permissions.canCreate) {
                        UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE);
                    }
                });
            }

            this.setState({ siteList: data, isLoading: false, loadingMessage: '' });
        });
    }

    viewResult(e, resultID) {
        e.preventDefault();
        UIHelper.redirectTo(AppConstants.SITE_RESULT_ROUTE, {
            userObj: JSON.stringify(this.state.loggedUserObj),
            resultID
        });
    }

    addJobClick(e) {
        e.preventDefault();

        var {
            siteObject, browser, testType, scheduleDate,
            isRecursiveCheck, recursiveSelect, jobName,
            selectedJobID, loggedUserObj, selectedTenant, selectedLocationID
        } = this.state;

        if (siteObject.error.hasError !== undefined && !siteObject.error.hasError) {
            siteObject.value = 'http://' + siteObject.value;


            if (selectedJobID) {

                // Update existing job
                this.setState({ isLoading: true, loadingMessage: MessageConstants.UPDATING_A_JOB });
                var url = Config.API_URL + AppConstants.JOB_UPDATE_API;

                let jobToUpdate = {
                    jobId: selectedJobID,
                    siteObject,
                    browser,
                    testType,
                    scheduleDate: moment(scheduleDate).format(AppConstants.DATE_FORMAT),
                    isRecursiveCheck,
                    recursiveSelect,
                    userEmail: loggedUserObj.email,
                    jobName: jobName.value,
                    tenantID: selectedTenant._id,
                    serverLocation: Config.SERVER_LOCATION_ARRAY[selectedLocationID]
                };

                jobApi.updateJob(url, { job: jobToUpdate }).then(() => {
                    this.setState({ isLoading: false, loadingMessage: '' });
                });
            } else {

                // Add a new job
                let jobObjectToInsert = {
                    jobId: UIHelper.getRandomHexaValue(),
                    siteObject,
                    browser,
                    testType,
                    scheduleDate: moment(scheduleDate).format(AppConstants.DATE_FORMAT),
                    isRecursiveCheck,
                    recursiveSelect,
                    userEmail: loggedUserObj.email,
                    jobName: jobName.value,
                    tenantID: selectedTenant._id,
                    serverLocation: Config.SERVER_LOCATION_ARRAY[selectedLocationID]
                };
                var url = Config.API_URL + AppConstants.JOB_INSERT_API;
                this.setState({ isLoading: true, loadingMessage: MessageConstants.ADDING_A_JOB });
                jobApi.addJob(url, jobObjectToInsert).then((data) => {

                    if (data.error) {
                        alert(data.error);
                    } else {
                        this.state.siteList.push(data);
                    }

                    this.setState({ isLoading: false, loadingMessage: '' });
                });

                this.setState({
                    siteObject: { value: '', error: {} },
                    recursiveSelect: AppConstants.RECURSIVE_EXECUTION_ARRAY[0],
                    browser: AppConstants.BROWSER_ARRAY[0].value
                });
            }

        } else {
            this.setState({
                siteObject: {
                    error: {
                        hasError: UIHelper.isUrlHasError(siteObject.value),
                        name: MessageConstants.URL_ERROR
                    }
                }
            });
        }

    }

    startOrStopJobClick(e, jobToStartOrStop) {
        e.preventDefault();

        this.setState({ isLoading: true, loadingMessage: MessageConstants.START_A_JOB });
        var url = Config.API_URL + AppConstants.JOB_START_API;

        var isStartValue = (jobToStartOrStop.recursiveSelect.isStart !== undefined
            && jobToStartOrStop.recursiveSelect.isStart);
        jobToStartOrStop.recursiveSelect.isStart = !isStartValue;
        jobApi.startOrStopJob(url, { job: jobToStartOrStop }).then(() => {
            this.setState({ isLoading: false, loadingMessage: '' });
        });

    }

    removeJobClick(e, jobIdToRemove) {
        e.preventDefault();

        this.setState({ isLoading: true, loadingMessage: MessageConstants.REMOVING_A_JOB });
        var url = Config.API_URL + AppConstants.JOB_REMOVE_API;
        jobApi.removeJob(url, { jobId: jobIdToRemove }).then(() => {
            let arrayAfterRemove = this.state.siteList.filter((siteObject) => {
                return siteObject.jobId !== jobIdToRemove;
            });
            this.setState({ siteList: arrayAfterRemove, isLoading: false, loadingMessage: '' });
        });

    }

    redirectToSiteLoad() {
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    recursiveCheckBoxClick() {
        this.setState({ isRecursiveCheck: !this.state.isRecursiveCheck });
    }

    viewResultJobClick(e, siteForResult) {
        e.preventDefault();

        if (siteForResult.result.length > 1) {

            // Route to result chart view
            UIHelper.redirectTo(AppConstants.SITE_CHART_RESULT_ROUTE, {
                userObj: JSON.stringify(this.state.loggedUserObj),
                job: JSON.stringify(siteForResult)
            });
        } else {
            // Route to single result view
            UIHelper.redirectTo(AppConstants.SITE_RESULT_ROUTE, {
                userObj: JSON.stringify(this.state.loggedUserObj),
                resultID: siteForResult.result[0].resultID
            });
        }

    }

    closeClick() {
        this.setState({ isModalVisible: false });
    }

    navigateToResultView(e) {
        e.preventDefault();
        UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE, {});
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
            scheduleDate,
            siteObject,
            browser,
            testType,
            loggedUserObj,
            isRecursiveCheck,
            isModalVisible,
            siteToResult,
            jobName,
            selectedTenant,
            selectedLocationID
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage} />
                <LeftNav selectedIndex={AppConstants.TESTS_INDEX} isFixedLeftNav={true} />
                {
                    (loggedUserObj)
                        ? <NavContainer
                            loggedUserObj={loggedUserObj}
                            isFixedNav={true}
                            tenantDropDown={this.tenantDropDown}/>
                        : <div className="sign-in-button">
                            <button onClick={() => { UIHelper.redirectTo(AppConstants.LOGIN_ROUTE); }}
                                className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                Sign in
                              </button>
                        </div>
                }
                {
                    // <div className="logo-div-container">
                    //     <img className="logo-img" src="./assets/img/logo.png"/>
                    // </div>
                    // <span className="input-group-addon">
                    //                 http://
                    //             </span>
                }
                <div className="site-add-container">
                    <form
                        name="site-add-form"
                        method="post"
                        id="monitor-test-form">
                        <h1 id="monitor-test-title" className="site-add-title">Monitor Site 24/7</h1>
                        <div className={
                            'form-group has-feedback ' +
                            ((jobName.error.hasError !== undefined)
                                ? ((jobName.error.hasError) ? 'has-error' : 'has-success') : '')
                        }>
                            <input
                                value={jobName.value}
                                onChange={(e) => {
                                    this.handleChange(e, {
                                        jobName: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isNameHasError(e.target.value),
                                                name: MessageConstants.NAME_ERROR
                                            }
                                        }
                                    });
                                }}
                                type="text"
                                className="form-control"
                                id="jobNameInput"
                                placeholder="NAME THIS TEST" />
                        </div>
                        <div className="form-group">
                            <div className={
                                'input-group has-feedback ' +
                                ((siteObject.error.hasError !== undefined)
                                    ? ((siteObject.error.hasError) ? 'has-error' : 'has-success') : '')
                            }>

                                <input
                                    value={siteObject.value}
                                    onChange={(e) => this.handleChange(e, {
                                        siteObject: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isUrlHasError(e.target.value),
                                                name: MessageConstants.URL_ERROR
                                            }
                                        }
                                    })}
                                    type="text"
                                    className="form-control"
                                    id="urlObjectInput"
                                    placeholder="ENTER WEBSITE URL" />
                            </div>
                            <ErrorMessageComponent error={siteObject.error} />
                        </div>
                        <div className="form-group">
                            <select
                                className="form-control form-control-sm form-group"
                                value={selectedLocationID}
                                onChange={(e) => this.dropDownClick({selectedLocationID: e.target.value})}>
                                {
                                    Config.SERVER_LOCATION_ARRAY.map((location, i) => {
                                        return (
                                            <option key={'location_' + i} value={location.locationid}>
                                                {location.textValue}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                        <div className="form-group radio-group">
                            {
                                AppConstants.TEST_TYPE_ARRAY.map((test, i) => {
                                    return <div className="radio radio-div-container">
                                                <label>
                                                    <input
                                                        value={test.value}
                                                        type="radio"
                                                        name="optradio"
                                                        checked={testType === test.value}
                                                        onChange={
                                                            (e) => this.dropDownClick({ testType: e.target.value })
                                                        }/>
                                                    {test.textValue}
                                                </label>
                                            </div>;
                                })
                            }
                        </div>
                        {
                            (testType === AppConstants.PERFORMANCE_TEST_TYPE)
                                ? <div className="form-group">
                                    <select
                                        className="form-control form-control-sm form-group"
                                        value={browser}
                                        onChange={(e) => this.dropDownClick({ browser: e.target.value })}>
                                        {
                                            AppConstants.BROWSER_ARRAY.map((browser, i) => {
                                                return <option key={'browser_' + i} value={browser.value}>
                                                    {browser.textValue}
                                                </option>;
                                            })
                                        }
                                    </select>
                                  </div>
                                : null
                        }

                        <div className="form-group form-row">
                            {
                                /* TODO : Uncomment for enable recursive selection
                                <DateTimePicker
                                    className="col-sm-6 my-1 datepicker-for-scheduler"
                                    onChange={(scheduleDate) => this.onChangeDateTime(scheduleDate)}
                                    value={scheduleDate}/>
                                        <div className="col-auto my-1">
                                        <div className="form-check">
                                            <input className="form-check-input recursive-checkbox"
                                                type="checkbox"
                                                id="recursiveCheck"
                                                value={isRecursiveCheck}
                                                onChange={this.recursiveCheckBoxClick}/>
                                            <label className="form-check-label" htmlFor="recursiveCheck">
                                                Recursive Execution
                                            </label>
                                        </div>
                                    </div>*/
                            }
                        </div>
                        {
                            (isRecursiveCheck)
                                ? <select
                                    disabled
                                    className="form-control form-control-sm form-group">
                                    {
                                        //     onChange={(e) => this.dropDownClick(
                                        //     {recursiveSelect: AppConstants.RECURSIVE_EXECUTION_ARRAY[e.target.value]})
                                        // }>
                                    }
                                    {
                                        AppConstants.RECURSIVE_EXECUTION_ARRAY.map((execution, i) => {
                                            return <option key={'execution_' + i} value={i}>
                                                {execution.textValue}
                                            </option>;
                                        })
                                    }
                                </select>
                                : null
                        }
                        <div className="form-group" id="monitor-test-button-container">
                            <button
                                className="btn btn-primary form-control half-button button-all-caps-text monitor-test-button"
                                onClick={(e) => this.addJobClick(e)}
                                {...(siteList.length >= 5) && { disabled: true }}>
                                Save Test
                            </button>
                            <button
                                className="btn btn-primary form-control half-button button-all-caps-text monitor-test-button"
                                onClick={(e) => this.navigateToResultView(e)}>
                                See Results
                            </button>
                        </div>
                        {
                            // (siteList.length > 0)
                            //     ? <div className="container site-list">
                            //         <h4>Job List</h4>
                            //         <table className="table table-bordered">
                            //             <thead>
                            //                 <tr>
                            //                     <th>Site URL</th>
                            //                     <th>Browser</th>
                            //                     <th>Scheduled Date and Time</th>
                            //                     <th></th>
                            //                 </tr>
                            //             </thead>
                            //             <tbody>
                            //                 {
                            //                     siteList.map((site, i) => {
                            //                         return (
                            //                             <tr className="table-row" key={'siteDetail' + i}>
                            //                                 <td className="table-cell">{site.siteObject.value}</td>
                            //                                 <td className="table-cell">{site.browser}</td>
                            //                                 <td className="table-cell">
                            //                                     {site.scheduleDate}
                            //                                     {
                            //                                         (site.isRecursiveCheck)
                            //                                             ? <div>({site.recursiveSelect.textValue})</div>
                            //                                             : null
                            //                                     }
                            //                                 </td>
                            //                                 <td>
                            //                                     <button
                            //                                         className="btn-danger form-control form-group"
                            //                                         onClick={(e) => this.removeJobClick(e, site.jobId)}
                            //                                         title={'Remove job of ' + site.siteObject.value}>
                            //                                         <span className="glyphicon glyphicon-remove"></span>
                            //                                     </button>
                            //                                     {
                            //                                         (site.isRecursiveCheck)
                            //                                             ? (site.recursiveSelect.isStart !== undefined
                            //                                                   && site.recursiveSelect.isStart)
                            //                                                 ? <button
                            //                                                     className="btn-primary form-control
                            //                                                         form-group"
                            //                                                     onClick={
                            //                                                         (e) => this.startOrStopJobClick(e,
                            //                                                             site, i)
                            //                                                     }
                            //                                                     title={
                            //                                                         'Stop job of '
                            //                                                         + site.siteObject.value
                            //                                                     }>
                            //                                                     <span
                            //                                                         className="glyphicon
                            //                                                         glyphicon-stop">
                            //                                                     </span>
                            //                                                 </button>
                            //                                                 : <button
                            //                                                     className="btn-primary
                            //                                                         form-control form-group"
                            //                                                     onClick={
                            //                                                         (e) => this.startOrStopJobClick(e,
                            //                                                             site, i)
                            //                                                     }
                            //                                                     title={
                            //                                                         'Start job of '
                            //                                                         + site.siteObject.value
                            //                                                     }>
                            //                                                     <span
                            //                                                         className="glyphicon
                            //                                                         glyphicon-play">
                            //                                                     </span>
                            //                                                 </button>
                            //                                             : null
                            //                                     }
                            //                                     {
                            //                                         (site.result.length !== 0)
                            //                                             ? <button
                            //                                                   className="btn-primary
                            //                                                       form-control form-group"
                            //                                                   onClick={
                            //                                                       (e) =>
                            //                                                         this.viewResultJobClick(e, site)
                            //                                                   }
                            //                                                   title={
                            //                                                       'Results of ' + site.siteObject.value
                            //                                                   }>
                            //                                                   <span
                            //                                                       className="glyphicon
                            //                                                         glyphicon glyphicon-tasks">
                            //                                                   </span>
                            //                                               </button>
                            //                                             : null
                            //                                     }
                            //                                     <ModalContainer
                            //                                         title={MessageConstants.SITE_RESULT_MESSAGE}
                            //                                         closeClick={this.closeClick}
                            //                                         viewResult={this.viewResult}
                            //                                         isModalVisible={isModalVisible}
                            //                                         modalType={AppConstants.DATA_MODAL}
                            //                                         dataObject={siteToResult}/>
                            //                                 </td>
                            //                             </tr>
                            //                         );
                            //                     })
                            //                 }
                            //             </tbody>
                            //         </table>
                            //       </div>
                            //     : null
                        }
                    </form>
                </div>
            </Fragment>
        );
    }
}

SiteAdd.propTypes = {
};

export default SiteAdd;
