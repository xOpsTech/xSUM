import React, {Fragment} from 'react';
import moment from 'moment';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
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
        this.redirectToSiteLoad = this.redirectToSiteLoad.bind(this);
        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Result View - xSum';
    }

    componentWillMount() {

        if (this.props.location.query.userObj) {
            var loggedUserObject = JSON.parse(this.props.location.query.userObj);
            this.setState({loggedUserObj: loggedUserObject});

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
            resultObj
        } = this.state;

        const ResultTile = (props) => {
            return (
                <div className="col-sm-5 tile">
                    <div className="result-heading">
                        {props.tileName}
                    </div>
                    <div className="result-value">
                        {(props.value / 1000)} <span className="measurement">seconds</span>
                    </div>
                </div>
            );
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                    {
                        <NavContainer
                                  loggedUserObj={loggedUserObj}
                                  siteLoad={this.redirectToSiteLoad}/>
                    }
                <div className="root-container result-view">
                    <h2>Results View</h2>
                    {
                        (resultObj)
                            ? <Fragment>
                                  <div className="row tile-row">
                                      <ResultTile tileName="Max Response Time" value={resultObj[0].max}/>
                                      <div className="col-sm-2"></div>
                                      <ResultTile tileName="Min Response Time" value={resultObj[0].min}/>
                                  </div>
                                  <div className="row tile-row">
                                      <ResultTile tileName="Mean Response Time" value={resultObj[0].mean}/>
                                      <div className="col-sm-2"></div>
                                      <ResultTile tileName="Median Response Time" value={resultObj[0].median}/>
                                  </div>
                                  <div className="row tile-row">
                                      <div className="col-sm-12 tile">
                                          <div className="result-heading">
                                              Executed Date and Time
                                          </div>
                                          <div className="result-value">
                                              {moment(resultObj[0].time).format(AppConstants.DATE_FORMAT)}
                                          </div>
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
