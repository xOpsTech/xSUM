import React, {Fragment} from 'react';
import moment from 'moment';
import AmCharts from '@amcharts/amcharts3-react';
import LazyLoad from 'react-lazy-load';
import socketIOClient from "socket.io-client";

import LeftNav from '../common/left-nav/LeftNav';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import MapContainer from '../common/map-container/MapContainer';
import jobApi from '../../api/jobApi';
import alertApi from '../../api/alertApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './SingleJobResultViewStyles.less';
/* eslint-enable no-unused-vars */

let socketClient;

class SingleJobResultView extends React.Component {
    constructor(props) {
        super(props);

        this.getJobData           = this.getJobData.bind(this);
        this.redirectToSiteLoad   = this.redirectToSiteLoad.bind(this);
        this.getAllAlerts         = this.getAllAlerts.bind(this);
        this.chartDropDownClick   = this.chartDropDownClick.bind(this);
        this.redirectToAddJob     = this.redirectToAddJob.bind(this);
        this.leftNavStateUpdate   = this.leftNavStateUpdate.bind(this);
        this.tenantDropDown       = this.tenantDropDown.bind(this);
        this.arrangeDashboardData = this.arrangeDashboardData.bind(this);
        this.arrangeSocketData    = this.arrangeSocketData.bind(this);
        this.barChartBarClick     = this.barChartBarClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Results View - ' + AppConstants.PRODUCT_NAME;
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
            jobsWithResults: [],
            locationMarker: [],
            alertData: [],
            isLeftNavCollapse: false,
            selectedTenant: {userList: []}
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
        UIHelper.getAllTenantsData(loggedUserObj, this, this.getJobData, true);
    }

    getJobData(loggedUserObj, selectedTenant, context) {
        if (this.props.location.query.jobID) {
            var selectedTenantID = this.props.location.query.tenantID;
            var selectedJobID = this.props.location.query.jobID;

            socketClient = socketIOClient(
                Config.API_URL,
                { query: 'selectedTenantID=' +  selectedTenantID + '&selectedJobID=' + selectedJobID}
            );
            socketClient.on(AppConstants.UPDATE_JOB_RESULTS + selectedTenantID + '_' + selectedJobID, (data) => {
                this.arrangeSocketData(data);
            });

            var urlToGetJobs = Config.API_URL + AppConstants.GET_JOB_WITH_RESULTS_API;

            context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
            var objectToRetrieve = {
                tenantID: selectedTenantID,
                jobId: selectedJobID
            };
            jobApi.getAllJobsFrom(urlToGetJobs, objectToRetrieve).then((data) => {
                this.arrangeDashboardData(data, context);
            });
        }

    }

    arrangeDashboardData(job, context) {
        var jobsList = [];

        jobsList.push({
            job: job,
            result: job.result,
            selectedChart: AppConstants.CHART_TYPES_ARRAY[0],
            selectedChartIndex: '0',
            barChartData: UIHelper.getArrangedBarChartData(job, 0, this)
        });

        var locationsArr = [];

        locationsArr.push({
            svgPath: AppConstants.TARGET_SVG,
            zoomLevel: 5,
            scale: 2,
            title: job.serverLocation.textValue,
            latitude: job.serverLocation.latitude,
            longitude: job.serverLocation.longitude
        });

        context.setState(
            {
                isLoading: false,
                loadingMessage: '',
                alertData: context.state.alertData,
                jobsWithResults: jobsList,
                locationMarker: locationsArr
            }
        );
    }

    chartDropDownClick(jobIndex, jobWithResult, selectedChartIndex) {
        var jobsList = this.state.jobsWithResults;
        jobWithResult.selectedChartIndex = selectedChartIndex;
        jobWithResult.selectedChart = AppConstants.CHART_TYPES_ARRAY[selectedChartIndex];
        jobWithResult.barChartData = UIHelper.getArrangedBarChartData(jobWithResult, selectedChartIndex, this);
        // Remove old job and add updated job
        jobsList.splice(jobIndex, 1, jobWithResult);
        this.setState({jobsWithResults: jobsList});
    }

    redirectToSiteLoad() {
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    tenantDropDown(stateObject) {

        // Socket off
        //socketClient.disconnect();

        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        this.setState(stateObject);

        this.getJobData(this.state.loggedUserObj, stateObject.selectedTenant, this);
    }

    arrangeSocketData(data) {
        var jobResultsLength = this.state.jobsWithResults[0].result.length;
        var updatedJobResultsLength = data.result.length;

        // Check final result executed time
        if (this.state.jobsWithResults.length > 0
            && this.state.jobsWithResults[0].result[jobResultsLength-1].executedTime
                !== data.result[updatedJobResultsLength-1].executedTime) {
            this.arrangeDashboardData(data, this);
        }

    }

    barChartBarClick(selectedResultIndex) {
        var {jobsWithResults} = this.state;
        var resultToSend = {
            results: JSON.stringify(jobsWithResults[0].job.result[selectedResultIndex])
        };
        resultToSend.securityProtocol = jobsWithResults[0].job.securityProtocol;
        resultToSend.urlValue = jobsWithResults[0].job.siteObject.value;
        resultToSend.locations = JSON.stringify([{
            svgPath: AppConstants.TARGET_SVG,
            zoomLevel: 5,
            scale: 2,
            title: jobsWithResults[0].job.serverLocation.textValue,
            latitude: jobsWithResults[0].job.serverLocation.latitude,
            longitude: jobsWithResults[0].job.serverLocation.longitude
        }]);
        UIHelper.redirectTo(AppConstants.SITE_RESULT_ROUTE, resultToSend);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            jobsWithResults,
            locationMarker,
            alertData,
            isLeftNavCollapse
        } = this.state;

        const ResultViewContainer = (props) => {
            const {barChartData} = props.jobWithResult;
            const barChartConfig = {
                color: '#fff',
                type: 'serial',
                theme: 'light',
                dataProvider: barChartData,
                valueAxes: [
                    {
                        gridColor: '#FFFFFF',
                        gridAlpha: 0.2,
                        dashLength: 0,
                        title: 'time in seconds',
                        autoRotateAngle: 90
                    }
                ],
                gridAboveGraphs: true,
                startDuration: 1,
                mouseWheelZoomEnabled: true,
                graphs: [
                    {
                        balloonText: '[[category]]: <b>[[value]] seconds</b>',
                        fillAlphas: 0.8,
                        lineAlpha: 0.2,
                        type: 'column',
                        valueField: props.fieldToDisplay,
                        fillColorsField: 'color'
                    }
                ],
                chartScrollbar: {
                    graph: 'g1',
                    oppositeAxis: false,
                    offset: 30,
                    scrollbarHeight: 5,
                    backgroundAlpha: 0,
                    selectedBackgroundAlpha: 0.1,
                    selectedBackgroundColor: '#888888',
                    graphFillAlpha: 0,
                    graphLineAlpha: 0.5,
                    selectedGraphFillAlpha: 0,
                    selectedGraphLineAlpha: 1,
                    autoGridCount: false,
                    color: '#AAAAAA'
                },
                chartCursor: {
                    limitToGraph:'g1',
                    fullWidth: true,
                    categoryBalloonEnabled: false,
                    cursorAlpha: 0,
                    zoomable: true,
                    valueZoomable: true
                },
                categoryField: 'execution',
                categoryAxis: {
                    gridPosition: 'start',
                    gridAlpha: 0,
                    tickPosition: 'start',
                    tickLength: 20,
                    autoRotateAngle: 45,
                    autoRotateCount: 5
                },
                maxSelectedTime: 3,
                export: {
                    enabled: true
                },
                listeners: [
                    {
                        event: 'clickGraphItem',
                        method: function(e) {
                            props.barChartBarClick(e.item.index);
                        }
                    }
                ]
            };

            var lastTestAvg = barChartData[barChartData.length-1]
                                    && barChartData[barChartData.length-1][props.fieldToDisplay];

            const pieChartConfig = {
                type: 'pie',
                theme: 'light',
                outlineAlpha: 0.7,
                outlineColor: '#343242',
                labelsEnabled: false,
                dataProvider: [
                    {
                        title: 'Average Response Time',
                        value: 3
                    },
                    {
                        title: 'Last Test Average',
                        value: lastTestAvg
                    }
                ],
                colors: [
                    '#222029', props.jobWithResult.job.pieChartColor
                ],
                titleField: 'title',
                valueField: 'value',
                labelRadius: 5,
                radius: '42%',
                innerRadius: '70%',
                labelText: '[[title]]',
                export: {
                    enabled: true
                }
            };

            return (
                <div className="row single-chart">
                    <div className="row">
                        <div className="col-sm-4">
                            {
                                (props.jobWithResult.result.length > 0 && props.jobWithResult.testType === AppConstants.PERFORMANCE_TEST_TYPE)
                                    ? <select className="form-control form-control-sm form-group chart-drop-down"
                                        value={props.jobWithResult.selectedChartIndex}
                                        onChange={(e) => this.chartDropDownClick(
                                            props.keyID,
                                            props.jobWithResult,
                                            e.target.value)
                                        }>
                                        {
                                            AppConstants.CHART_TYPES_ARRAY.map((chartType, i) => {
                                                return (
                                                    <option key={'chartType_' + i} value={i}>
                                                        {chartType.textValue}
                                                    </option>
                                                );
                                            })
                                        }
                                      </select>
                                    : null
                            }
                        </div>
                        <div className="col-sm-3">
                            <h4 className="job-name-div">
                                Job Name : {props.jobWithResult.job.jobName}
                            </h4>
                        </div>
                        <div className="col-sm-5">
                            <h4 className="job-name-div">
                                {props.chartTitle}
                            </h4>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-4">
                            <div className="row">
                                <AmCharts.React style={{width: '100%', height: '270px'}} options={pieChartConfig}/>
                            </div>
                            <div className="row pie-chart-heading">
                                Last Test Average
                            </div>
                        </div>
                        <div className="col-sm-8">
                            <AmCharts.React style={{width: '100%', height: '300px'}} options={barChartConfig}/>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                                  loggedUserObj={loggedUserObj}
                                  isFixedNav={true}
                                  leftNavStateUpdate={this.leftNavStateUpdate}
                                  tenantDropDown={this.tenantDropDown}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <LeftNav
                    selectedIndex={AppConstants.ALL_RESULT_CHART_VIEW_INDEX}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                    isSubSectionExpand={true}
                    subSectionIndex={AppConstants.DASHBOARDS_INDEX}/>
                <div className={
                        'all-result-view ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                    <div className="row chart-view">
                        {
                            (jobsWithResults.length > 0)
                                ? jobsWithResults.map((jobWithResult, i) => {
                                    return (
                                        <div>
                                            <LazyLoad height={345} offsetVertical={300}>
                                                <ResultViewContainer
                                                    jobWithResult={jobWithResult}
                                                    keyID={i}
                                                    fieldToDisplay={'responseTime'}
                                                    chartTitle={'Response Time'}
                                                    barChartBarClick={this.barChartBarClick}/>
                                            </LazyLoad>
                                            <LazyLoad height={345} offsetVertical={300}>
                                                <ResultViewContainer
                                                    jobWithResult={jobWithResult}
                                                    keyID={i}
                                                    fieldToDisplay={'dnsLookUpTime'}
                                                    chartTitle={'DNS Time'}
                                                    barChartBarClick={this.barChartBarClick}/>
                                            </LazyLoad>
                                            <LazyLoad height={345} offsetVertical={300}>
                                                <ResultViewContainer
                                                    jobWithResult={jobWithResult}
                                                    keyID={i}
                                                    fieldToDisplay={'tcpConnectTime'}
                                                    chartTitle={'TCP Connect Time'}
                                                    barChartBarClick={this.barChartBarClick}/>
                                            </LazyLoad>
                                            <LazyLoad height={345} offsetVertical={300}>
                                                <ResultViewContainer
                                                    jobWithResult={jobWithResult}
                                                    keyID={i}
                                                    fieldToDisplay={'lastByteRecieveTime'}
                                                    chartTitle={'Last Byte Recieve Time'}
                                                    barChartBarClick={this.barChartBarClick}/>
                                            </LazyLoad>
                                        </div>
                                    );
                                })
                                : null
                        }
                    </div>
                </div>
            </Fragment>
        );
    }
}

SingleJobResultView.propTypes = {
};

export default SingleJobResultView;
