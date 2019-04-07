import React, {Fragment} from 'react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import DockerJobResult from '../common/docker-job-result/DockerJobResult';
import LogoContainer from '../common/logo-container/LogoContainer';
import ScriptTestResult from '../common/script-test-result/ScriptTestResult';
import jobApi from '../../api/jobApi';

import * as MessageConstants from '../../constants/MessageConstants';
import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './AuthJobResultStyles.less';
/* eslint-enable no-unused-vars */

class AuthJobResult extends React.Component {
    constructor(props) {
        super(props);

        this.signUpClick       = this.signUpClick.bind(this);
        this.getOneTimeJobData = this.getOneTimeJobData.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: MessageConstants.FETCHING_RESULT,
            alertData: [],
            jobsWithResults: [],
            selectedTenant: {userList: []}
        };

        return initialState;
    }

    componentDidMount() {
        document.title = 'Job Results - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'block';
    }

    componentWillMount() {

        if (this.props.location.query.tag) {
            this.getOneTimeJobData(this.props.location.query.tag);
        } else {
            UIHelper.redirectLogin();
        }

    }

    getOneTimeJobData(tagCode) {
        var urlToGetResults = Config.API_URL + AppConstants.GET_ONE_TIME_RESULTS_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_RESULT});
        var objectToRetrieve = {
            tagCode: tagCode
        };
        jobApi.getAllJobsFrom(urlToGetResults, objectToRetrieve).then((data) => {
            this.setState({isLoading: false, loadingMessage: ''});

            if (data.message === AppConstants.RESPONSE_ERROR) {
                UIHelper.redirectLogin();
            } else {
                var job = data.selectedJob;
                var jobsWithResults = [];

                jobsWithResults.push({
                    job: job,
                    result: job.result,
                    selectedChart: AppConstants.CHART_TYPES_ARRAY[0],
                    selectedChartIndex: '0',
                    barChartData: UIHelper.getArrangedBarChartData(job, 0, this)
                });
                this.setState({jobsWithResults, selectedTenant: data.selectedTenant});
            }

        });
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    handleKeyPress(e){
        if (e.key === 'Enter') {
            e.preventDefault();
            this.loginCheck(e);
        }
    }

    signUpClick(e) {
        e.preventDefault();
        UIHelper.redirectTo(AppConstants.SIGN_UP_ROUTE, {});
    }

    addFeedback(e) {
        e.preventDefault;
        UIHelper.redirectTo(AppConstants.ADD_FEEDBACK_ROUTE);
    }

    render() {
        const {isLoading, loadingMessage, jobsWithResults, selectedTenant} = this.state;

        return (
            <Fragment>
                <LogoContainer/>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                {
                    (jobsWithResults.length > 0)
                        ? jobsWithResults.map((jobWithResult, i) => {
                            return (
                                <ScriptTestResult
                                    jobWithResult={jobWithResult}
                                    selectedTenant={selectedTenant}
                                    key={i}/>
                            );
                        })
                        : null
                }
            </Fragment>
        );
    }
}


export default AuthJobResult;
