import React, {Fragment} from 'react';
import {Bar} from 'react-chartjs';
import GoogleMapReact from 'google-map-react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './AllResultViewStyles.less';
/* eslint-enable no-unused-vars */

class AllResultView extends React.Component {
    constructor(props) {
        super(props);

        this.getAllJobs           = this.getAllJobs.bind(this);
        this.redirectToSiteLoad   = this.redirectToSiteLoad.bind(this);
        this.chartDropDownClick   = this.chartDropDownClick.bind(this);
        this.getArrangedChartData = this.getArrangedChartData.bind(this);
        this.redirectToAddJob     = this.redirectToAddJob.bind(this);
        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Results View - xSum';
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
            loggedUserObj: null,
            siteList: [],
            isChartDataArrived: false,
            maxChartData: null,
            minChartData: null,
            meanChartData: null,
            medianChartData: null,
            jobsWithResults: []
        };

        return initialState;
    }

    getAllJobs(loggedUserObj) {
        var urlToGetJobs = AppConstants.API_URL + AppConstants.JOBS_GET_API;
        var urlForResultJob = AppConstants.API_URL + AppConstants.GET_ALL_RESULTS_JOB_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        jobApi.getAllJobsFrom(urlToGetJobs, {userEmail: loggedUserObj.email}).then((data) => {

            for (var i = 0; i < data.length; i++) {
                var currentJob = data[i];

                jobApi.getResult(urlForResultJob, {jobID: data[i].jobId}).then((jobResult) => {


                    var resultsArr = this.state.jobsWithResults;
                    resultsArr.push({
                        job: currentJob,
                        result: jobResult,
                        selectedChart: AppConstants.CHART_TYPES_ARRAY[0],
                        selectedChartIndex: '0',
                        chartData: this.getArrangedChartData(jobResult, 0)
                    });
                    this.setState({jobsWithResults: resultsArr});
                });

            }

            this.setState({siteList: data, isLoading: false, loadingMessage: ''});
        });
    }

    getArrangedChartData(jobResult, selectedChartIndex) {
        var chartDataObj = {
            labels: [],
            datasets: [
                {
                    label: 'Max Response time',
                    fillColor: '#ba10c1',
                    strokeColor: '#75777a',
                    highlightFill: '#bec5d1',
                    highlightStroke: '#555759',
                    data: []
                }
            ],
            resultObjects: []
        };

        var resultCount = 1;
        for (var i = 0; i < jobResult.length; i++) {

            // Check Result ID exists
            var isResultIdFound = chartDataObj.resultObjects.find(function(jobObj) {
                return jobObj.resultID === jobResult[i].resultID;
            });

            if (!isResultIdFound) {
                chartDataObj.labels.push('Execution ' + (resultCount++));
                chartDataObj.datasets[0].data.push(jobResult[i][AppConstants.CHART_TYPES_ARRAY[selectedChartIndex].value]/1000);
                chartDataObj.resultObjects.push(jobResult[i]);
            }
        }

        return chartDataObj;
    }

    chartDropDownClick(jobIndex, jobWithResult, selectedChartIndex) {
        var jobsList = this.state.jobsWithResults;
        jobWithResult.selectedChartIndex = selectedChartIndex;
        jobWithResult.selectedChart = AppConstants.CHART_TYPES_ARRAY[selectedChartIndex];
        jobWithResult.chartData = this.getArrangedChartData(jobWithResult.result, selectedChartIndex);
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
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isChartDataArrived,
            maxChartData,
            minChartData,
            meanChartData,
            medianChartData,
            siteList,
            jobsWithResults
        } = this.state;

        const ResultViewContainer = (props) => {
            var barChartOptions = {
                //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
                scaleBeginAtZero : false
            };
            return (
                <div className="row single-chart">
                    <select className="form-control form-control-sm form-group chart-drop-down"
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
                    <div className="row">
                        <div className="col-sm-4">
                        </div>
                        <div className="col-sm-8">
                            <Bar data={props.jobWithResult.chartData} options={barChartOptions} width="600" height="300"/>
                        </div>
                    </div>
                </div>
            );
        };

        const googleMaps = {
            center: {
                lat: 6.927079,
                lng: 79.861244
            },
            zoom: 5
        };

        const LocationMarker = (props) => {
            return (
                <Fragment>
                    <i className="glyphicon glyphicon-map-marker map-marker"/>
                    <h4 className="map-text">{props.text}</h4>
                </Fragment>
            );
        };

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
                <div className="all-result-view">
                    <div className="row map-container">
                        <GoogleMapReact
                            bootstrapURLKeys={{key: AppConstants.GOOGLE_MAP_KEY}}
                            defaultCenter={googleMaps.center}
                            defaultZoom={googleMaps.zoom}>
                            <LocationMarker
                                lat={6.927079}
                                lng={79.861244}
                                text={'Your Location'}/>
                        </GoogleMapReact>
                    </div>
                    <div className="row chart-view">
                        {
                            (jobsWithResults.length > 0)
                                ? jobsWithResults.map((jobWithResult, i) => {
                                      return <ResultViewContainer jobWithResult={jobWithResult} keyID={i}/>
                                  })
                                : null
                        }
                    </div>
                    <div className="row add-test-section">
                        <div className="col-sm-4"></div>
                        <div className="col-sm-4 add-test-text" onClick={this.redirectToAddJob}>
                            Add a test
                            <div className="plus-icon">+</div>
                        </div>
                        <div className="col-sm-4"></div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

AllResultView.propTypes = {
};

export default AllResultView;
