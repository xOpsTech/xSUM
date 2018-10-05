import React, {Fragment} from 'react';
import moment from 'moment';
import AmCharts from '@amcharts/amcharts3-react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import MapContainer from '../common/map-container/MapContainer';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './ResultViewStyles.less';
/* eslint-enable no-unused-vars */

class ResultView extends React.Component {
    constructor(props) {
        super(props);

        this.getResult = this.getResult.bind(this);
        this.redirectToAddJob = this.redirectToAddJob.bind(this);
        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Result View - xSum';
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {

        if (this.props.location.query.resultID) {

            if (this.props.location.query.userObj) {
                var loggedUserObject = JSON.parse(this.props.location.query.userObj);
                this.setState({loggedUserObj: loggedUserObject});
            }

            this.getResult(this.props.location.query.resultID);
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
            resultObj: null
        };

        return initialState;
    }

    getResult(resultID) {
        var url = AppConstants.API_URL + AppConstants.GET_RESULT_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_RESULT});
        jobApi.getResult(url, {resultID}).then((data) => {
            this.setState({resultObj: data, isLoading: false, loadingMessage: ''});
        });
    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            resultObj
        } = this.state;

        const ResultTile = (props) => {
            return (
                <div className="row result-tile">
                    <div className="arrow-title-div col-sm-5">
                        {props.tileName}
                    </div>
                    <div className="value-div col-sm-7">
                        {props.value}
                    </div>
                </div>
            );
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                {
                    // (loggedUserObj)
                    //     ? <NavContainer
                    //               loggedUserObj={loggedUserObj}
                    //               siteLoad={this.redirectToSiteLoad}/>
                    //     : <div className="sign-in-button">
                    //           <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                    //               className="btn btn-primary btn-sm log-out-drop-down--li--button">
                    //               Sign in
                    //           </button>
                    //       </div>
                }
                <div className="result-view-container">
                    {
                        (resultObj)
                            ? <Fragment>
                                  <div className="row">
                                      <div className="col-xs-3 result-summary">
                                          <ResultTile tileName="Website"
                                              value={UIHelper.replaceCharacter(resultObj[0].group, '_', '.')}/>
                                          <ResultTile tileName="Date"
                                              value={moment(resultObj[0].time).format(AppConstants.DATE_ONLY_FORMAT)}/>
                                          <ResultTile tileName="Time"
                                              value={moment(resultObj[0].time).format(AppConstants.TIME_ONLY_FORMAT)}/>
                                          <ResultTile tileName="Browser"
                                              value={UIHelper.toTitleCase(resultObj[0].browser)}/>
                                          <ResultTile tileName="Max Time" value={resultObj[0].max/1000}/>
                                          <ResultTile tileName="Min Time" value={resultObj[0].min/1000}/>
                                          <ResultTile tileName="Mean Time" value={resultObj[0].mean/1000}/>
                                          <ResultTile tileName="Median Time" value={resultObj[0].median/1000}/>

                                          <div className="row backbutton" onClick={this.redirectToAddJob}>
                                              <div className="col-sm-4">
                                              </div>
                                              <div className="arrow-back-div col-sm-8">
                                                  Run another test
                                              </div>
                                          </div>
                                      </div>
                                      <div className="col-xs-8 result-view-map">
                                          <MapContainer height="100%" width="100%"/>
                                      </div>
                                  </div>
                              </Fragment>
                            : null
                    }
                </div>
            </Fragment>
        );
    }
}

ResultView.propTypes = {
};

export default ResultView;
