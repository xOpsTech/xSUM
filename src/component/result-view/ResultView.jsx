import React, {Fragment} from 'react';
import moment from 'moment';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import MapContainer from '../common/map-container/MapContainer';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
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
        document.title = 'Result View - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {

        if (this.props.location.query.resultID) {
            var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

            if (siteLoginCookie) {
                var loggedUserObject = JSON.parse(siteLoginCookie);
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
            resultObj: null,
            locationMarker: []
        };

        return initialState;
    }

    getResult(resultID) {
        var url = Config.API_URL + AppConstants.GET_RESULT_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_RESULT});
        jobApi.getResult(url, {resultID}).then((data) => {
            var locationMarkerArr = this.state.locationMarker;
            locationMarkerArr.push({
                svgPath: AppConstants.TARGET_SVG,
                zoomLevel: 5,
                scale: 2,
                title: data.location.title,
                latitude: data.location.latitude,
                longitude: data.location.longitude
            });
            this.setState({resultObj: data, isLoading: false, loadingMessage: ''});
        });
    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            resultObj,
            locationMarker
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
                                              value={resultObj.urlValue}/>
                                          <ResultTile tileName="Date"
                                              value={moment(resultObj.dateTime).format(AppConstants.DATE_ONLY_FORMAT)}/>
                                          <ResultTile tileName="Time"
                                              value={moment(resultObj.dateTime).format(AppConstants.TIME_ONLY_FORMAT)}/>
                                          <ResultTile
                                              tileName="First Byte"
                                              value={
                                                  UIHelper.roundValueToTwoDecimals(resultObj.results.response/10) +
                                                  ' seconds'
                                              }/>
                                          <ResultTile
                                              tileName="Last Byte"
                                              value={
                                                  UIHelper.roundValueToTwoDecimals(resultObj.results.end/10) +
                                                  ' seconds'
                                              }/>
                                          <ResultTile
                                              tileName="DNS Resolve"
                                              value={
                                                  UIHelper.roundValueToTwoDecimals(resultObj.results.lookup/10) +
                                                  ' seconds'
                                              }/>
                                          <ResultTile
                                              tileName="TCP Ack"
                                              value={
                                                  UIHelper.roundValueToTwoDecimals(resultObj.results.connect/10) +
                                                  ' seconds'
                                              }/>
                                          <ResultTile
                                              tileName="Socket Req"
                                              value={
                                                  UIHelper.roundValueToTwoDecimals(resultObj.results.socket/10) +
                                                  ' seconds'
                                              }/>
                                          <div className="row backbutton" onClick={this.redirectToAddJob}>
                                              <div className="col-sm-4">
                                              </div>
                                              <div className="arrow-back-div col-sm-8">
                                                  Run another test
                                              </div>
                                          </div>
                                      </div>
                                      <div className="col-xs-8 result-view-map">
                                          <MapContainer height="100%" width="100%" locationMarker={locationMarker}/>
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
