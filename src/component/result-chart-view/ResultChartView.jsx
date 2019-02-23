import React, {Fragment} from 'react';
import {Bar} from 'react-chartjs';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './ResultChartViewStyles.less';
/* eslint-enable no-unused-vars */

class ResultChartView extends React.Component {
    constructor(props) {
        super(props);

        this.getResults         = this.getResults.bind(this);
        this.redirectToSiteLoad = this.redirectToSiteLoad.bind(this);
        this.setupChartData     = this.setupChartData.bind(this);
        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Result Chart View - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {

        if (this.props.location.query.job) {

            if (this.props.location.query.userObj) {
                var loggedUserObject = JSON.parse(this.props.location.query.userObj);
                this.setState({loggedUserObj: loggedUserObject});
            }

            var passedJob = JSON.parse(this.props.location.query.job);
            this.setState({passedJob});
            this.getResults(passedJob.jobId);
        } else {
            UIHelper.redirectLogin();
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            passedJob: null,
            isChartDataArrived: false,
            maxChartData: null,
            minChartData: null,
            meanChartData: null,
            medianChartData: null
        };

        return initialState;
    }

    getResults(jobID) {
        var url = Config.API_URL + AppConstants.GET_ALL_RESULTS_JOB_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_RESULT});
        jobApi.getResult(url, {jobID}).then((data) => {
            this.setupChartData(data);
        });
    }

    setupChartData(recievedData) {
        var maxDataObj = {
            labels: [],
            datasets: [
                {
                    label: 'Max Response time',
                    fillColor: '#d3d9e2',
                    strokeColor: '#75777a',
                    highlightFill: '#bec5d1',
                    highlightStroke: '#555759',
                    data: []
                }
            ],
            resultObjects: []
        };

        var minDataObj = {
            labels: [],
            datasets: [
                {
                    label: 'Min Response time',
                    fillColor: '#d3d9e2',
                    strokeColor: '#75777a',
                    highlightFill: '#bec5d1',
                    highlightStroke: '#555759',
                    data: []
                }
            ],
            resultObjects: []
        };

        var meanDataObj = {
            labels: [],
            datasets: [
                {
                    label: 'Mean Response time',
                    fillColor: '#d3d9e2',
                    strokeColor: '#75777a',
                    highlightFill: '#bec5d1',
                    highlightStroke: '#555759',
                    data: []
                }
            ],
            resultObjects: []
        };

        var medianDataObj = {
            labels: [],
            datasets: [
                {
                    label: 'Median Response time',
                    fillColor: '#d3d9e2',
                    strokeColor: '#75777a',
                    highlightFill: '#bec5d1',
                    highlightStroke: '#555759',
                    data: []
                }
            ],
            resultObjects: []
        };

        var maxResultNo = 1;
        var minResultNo = 1;
        var meanResultNo = 1;
        var medianResultNo = 1;
        for (var i = 0; i < recievedData.length; i++) {

            // Check Result ID exists
            var isResultIdFound = maxDataObj.resultObjects.find(function(jobResult) {
                return jobResult.resultID === recievedData[i].resultID;
            });

            if (!isResultIdFound) {
                maxDataObj.labels.push('Execution ' + (maxResultNo++));
                maxDataObj.datasets[0].data.push(recievedData[i].max/1000);
                maxDataObj.resultObjects.push(recievedData[i]);

                minDataObj.labels.push('Execution ' + (minResultNo++));
                minDataObj.datasets[0].data.push(recievedData[i].min/1000);
                minDataObj.resultObjects.push(recievedData[i]);

                meanDataObj.labels.push('Execution ' + (meanResultNo++));
                meanDataObj.datasets[0].data.push(recievedData[i].mean/1000);
                meanDataObj.resultObjects.push(recievedData[i]);

                medianDataObj.labels.push('Execution ' + (medianResultNo++));
                medianDataObj.datasets[0].data.push(recievedData[i].median/1000);
                medianDataObj.resultObjects.push(recievedData[i]);
            }

        }

        this.setState(
            {
                isLoading: false,
                loadingMessage: '',
                isChartDataArrived: true,
                maxChartData: maxDataObj,
                minChartData: minDataObj,
                meanChartData: meanDataObj,
                medianChartData: medianDataObj
            }
        );
    }

    redirectToSiteLoad() {
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            passedJob,
            isChartDataArrived,
            maxChartData,
            minChartData,
            meanChartData,
            medianChartData
        } = this.state;

        var options = {
            //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            scaleBeginAtZero : false
        };

        const DisplayChart = (props) => {
            return (
                <Fragment>
                    <h3>{props.title}</h3>
                    <Bar data={props.chartData} options={options} width="600" height="300"/>
                </Fragment>
            );
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                                  loggedUserObj={loggedUserObj}
                                  siteLoad={this.redirectToSiteLoad}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div className="root-container result-view">
                    <h2>Results for {passedJob.siteObject.value}</h2>
                    {
                        (isChartDataArrived)
                            ? <Fragment>
                                  <DisplayChart title="Max response comparison" chartData={maxChartData}/>
                                  <DisplayChart title="Min response comparison" chartData={minChartData}/>
                                  <DisplayChart title="Mean response comparison" chartData={meanChartData}/>
                                  <DisplayChart title="Median response comparison" chartData={medianChartData}/>
                              </Fragment>
                            : null
                    }
                </div>
            </Fragment>
        );
    }
}

ResultChartView.propTypes = {
};

export default ResultChartView;
