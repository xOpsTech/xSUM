import React, {Fragment} from 'react';
import DateTimePicker from 'react-datetime-picker';
import moment from 'moment';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import jobApi from '../../api/jobApi';
import ModalContainer from '../common/modal-container/ModalContainer';

import * as AppConstants from '../../constants/AppConstants';
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

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Site Add - xSum';
    }

    componentWillMount() {

        if (this.props.location.query.userObj) {
            var loggedUserObject = JSON.parse(this.props.location.query.userObj);
            this.setState({loggedUserObj: loggedUserObject});

            this.getAllJobs(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            siteObject: {value:'', error: {}},
            browser  : AppConstants.BROWSER_ARRAY[0].value,
            siteList : [],
            scheduleDate: new Date(),
            loggedUserObj: null,
            isRecursiveCheck: true,
            recursiveSelect: AppConstants.RECURSIVE_EXECUTION_ARRAY[0],
            isModalVisible: false,
            siteToResult: null
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

    getAllJobs(loggedUserObj) {
        var url = AppConstants.API_URL + AppConstants.JOBS_GET_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        jobApi.getAllJobsFrom(url, {userEmail: loggedUserObj.email}).then((data) => {
            this.setState({siteList: data, isLoading: false, loadingMessage: ''});
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

        var {siteObject, browser, scheduleDate, isRecursiveCheck, recursiveSelect} = this.state;

        if (siteObject.error.hasError !== undefined && !siteObject.error.hasError) {
            siteObject.value = 'http://' + siteObject.value;
            let jobObjectToInsert = {
                jobId: UIHelper.getRandomHexaValue(),
                siteObject,
                browser,
                scheduleDate: moment(scheduleDate).format(AppConstants.DATE_FORMAT),
                isRecursiveCheck,
                recursiveSelect,
                userEmail: this.state.loggedUserObj.email
            };

            var url = AppConstants.API_URL + AppConstants.JOB_INSERT_API;
            this.setState({isLoading: true, loadingMessage: MessageConstants.ADDING_A_JOB});
            jobApi.addJob(url, jobObjectToInsert).then((data) => {

                if (data.error) {
                    alert(data.error);
                } else {
                    this.state.siteList.push(data);
                }

                this.setState({isLoading: false, loadingMessage: ''});
            });

            this.setState({
                siteObject     : {value:'', error: {}},
                recursiveSelect: AppConstants.RECURSIVE_EXECUTION_ARRAY[0],
                browser        : AppConstants.BROWSER_ARRAY[0].value
            });
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

        this.setState({isLoading: true, loadingMessage: MessageConstants.START_A_JOB});
        var url = AppConstants.API_URL + AppConstants.JOB_START_API;

        var isStartValue = (jobToStartOrStop.recursiveSelect.isStart !== undefined
                                && jobToStartOrStop.recursiveSelect.isStart);
        jobToStartOrStop.recursiveSelect.isStart = !isStartValue;
        jobApi.startOrStopJob(url, {job: jobToStartOrStop}).then(() => {
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
        this.setState({isRecursiveCheck: !this.state.isRecursiveCheck});
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
        this.setState({isModalVisible: false});
    }

    navigateToResultView(e) {
        e.preventDefault();
        UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            siteList,
            scheduleDate,
            siteObject,
            browser,
            loggedUserObj,
            isRecursiveCheck,
            isModalVisible,
            siteToResult
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
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
                {
                    // <div className="logo-div-container">
                    //     <img className="logo-img" src="./assets/img/logo.png"/>
                    // </div>
                }
                <div className="site-add-container">
                    <form
                        name="site-add-form"
                        method="post">
                        <h1 className="site-add-title">Monitor Site 24/7</h1>
                        <div className="form-group">
                            <div className={
                                    'input-group has-feedback ' +
                                    ((siteObject.error.hasError !== undefined)
                                        ? ((siteObject.error.hasError) ? 'has-error' : 'has-success') : '')
                                }>
                                <span className="input-group-addon">
                                    http://
                                </span>
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
                                    placeholder="ENTER WEBSITE URL"/>
                            </div>
                            <ErrorMessageComponent error={siteObject.error}/>
                        </div>
                        <div className="form-group">
                            <select
                                  className="form-control form-control-sm form-group"
                                  value={browser}
                                  onChange={(e) => this.dropDownClick({browser: e.target.value})}>
                                  {
                                      AppConstants.BROWSER_ARRAY.map((browser, i) => {
                                          return <option key={'browser_' + i} value={browser.value}>
                                                    {browser.textValue}
                                                </option>;
                                      })
                                  }
                              </select>
                        </div>
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
                        <div className="form-group">
                            <button
                                className="btn btn-primary form-control half-button button-all-caps-text"
                                onClick={(e) => this.addJobClick(e)}
                                {...(siteList.length >= 5) && {disabled: true}}>
                                Save Test
                            </button>
                            <button
                                className="btn btn-primary form-control half-button button-all-caps-text"
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
