import React, {Fragment} from 'react';
import {Panel} from 'react-bootstrap';
import moment from 'moment';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import ModalContainer from '../common/modal-container/ModalContainer';
import urlApi from '../../api/urlApi';

import * as AppConstants from '../../constants/AppConstants';
import * as MessageConstants from '../../constants/MessageConstants';
import * as UIHelper from '../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './SiteLoadStyles.less';
/* eslint-enable no-unused-vars */

class SiteAdd extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange         = this.handleChange.bind(this);
        this.searchKeyPress       = this.searchKeyPress.bind(this);
        this.searchClick          = this.searchClick.bind(this);
        this.searchURL            = this.searchURL.bind(this);
        this.setStorageValue      = this.setStorageValue.bind(this);
        this.insertToDB           = this.insertToDB.bind(this);
        this.loopToCheckUrl       = this.loopToCheckUrl.bind(this);
        this.modalYesClick        = this.modalYesClick.bind(this);
        this.modalNoClick         = this.modalNoClick.bind(this);
        this.viewResult           = this.viewResult.bind(this);
        this.getLoggedUserUrlData = this.getLoggedUserUrlData.bind(this);
        this.viewHistory          = this.viewHistory.bind(this);
        this.redirectToAddJob     = this.redirectToAddJob.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentWillMount() {

        if (this.props.location.query.userObj) {
            var loggedUserObject = JSON.parse(this.props.location.query.userObj);
            this.setState({loggedUserObj: loggedUserObject});
            let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

            if (storageID) {
                this.setState({isModalVisible: true});
            }

            this.getLoggedUserUrlData(loggedUserObject);
        }

    }

    componentDidMount() {
        document.title = 'Site Load - xSum';
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            loggedUserObj: null,
            urlObject : {value:'', error: {}},
            isLoading: false,
            isModalVisible: false,
            result: {isResultRecieved: false, resultUrl: '', searchedUrl: ''},
            oldUrlResults: [],
            isViewHistoryVisible: false
        };

        return initialState;
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    searchKeyPress(e) {

        if(e.key == 'Enter') {
            this.searchURL();
        }

    }

    searchClick() {

        if (!this.state.isLoading) {
            this.setState({result: {isResultRecieved: false, url: '', searchedUrl: ''}});
            this.searchURL();
        }

    }

    searchURL() {

        if (this.state.urlObject.error.hasError !== undefined && !this.state.urlObject.error.hasError) {
            let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

            if (storageID) {
                UIHelper.removeLocalStorageValue(AppConstants.STORAGE_ID);
            } else {
                let randomHash = UIHelper.getRandomHexaValue();

                // Store in backend
                this.insertToDB(randomHash);
            }
        }


    }

    setStorageValue(randomHash) {
        UIHelper.setLocalStorageValue(AppConstants.STORAGE_ID, randomHash);
    }

    insertToDB(randomHash) {
        let {urlObject, loggedUserObj} = this.state;

        var url, urlObj;

        // Check user logged in or not
        if (loggedUserObj) {
            url = AppConstants.API_URL + AppConstants.URL_INSERT_LOGGED_USER_API;
            urlObj = {
                hashID: randomHash,
                urlValue: 'http://' + urlObject.value,
                userEmail: loggedUserObj.email
            };
        } else {
            url = AppConstants.API_URL + AppConstants.URL_INSERT_API;
            urlObj = {hashID: randomHash, urlValue: 'http://' + urlObject.value};
        }

        this.setState({isLoading: true});

        urlApi.setUrlData(url, urlObj).then((json) => {

            // Store hash in browser
            this.setStorageValue(randomHash);

            if (json.status !== AppConstants.URL_NEW_STATE) {
                this.setState({isLoading: false});
            } else {
                this.loopToCheckUrl();
            }

        }).catch((error) => {
            this.setState({isLoading: false});
            alert(error);
        });
    }

    loopToCheckUrl() {
        var secondsToSendReq = 2;
        var intervalUrl = setInterval(() => {

            let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

            if (storageID) {
                var url = AppConstants.API_URL + AppConstants.URL_GET_API;
                urlApi.getUrlData(url, {hashID: storageID}).then((data) => {
                    if (data[0].status === AppConstants.URL_DONE_STATE) {
                        this.setState({isLoading: false});
                        UIHelper.removeLocalStorageValue(AppConstants.STORAGE_ID);
                        clearInterval(intervalUrl);
                        this.setState({
                            result: {
                                isResultRecieved: true,
                                resultID: data[0].resultID,
                                searchedUrl: data[0].url
                            }
                        });
                        // TODO: display result set(need to update the state of result array)
                    }
                });
            }

        }, 1000 * secondsToSendReq);
    }

    viewResult(e, result) {

        e.preventDefault();
        var objectToPass;

        if (this.state.loggedUserObj) {
            objectToPass = {
                userObj: JSON.stringify(this.state.loggedUserObj),
                resultID: result.resultID
            };
        } else {
            objectToPass = {
                resultID: result.resultID
            };
        }

        UIHelper.redirectTo(AppConstants.SITE_RESULT_ROUTE, objectToPass);
    }

    modalYesClick() {
        this.setState({isModalVisible:false});
        this.setState({isLoading: true});
        this.loopToCheckUrl();
    }

    modalNoClick() {
        this.setState({isModalVisible:false});
        UIHelper.removeLocalStorageValue(AppConstants.STORAGE_ID);
    }

    getLoggedUserUrlData(loggedUserObj) {
        var url = AppConstants.API_URL + AppConstants.URL_GET_LOGGED_USER_URL_API;
        urlApi.getUrlData(url, {userEmail: loggedUserObj.email}).then((data) => {
            this.setState({oldUrlResults: data});
        });
    }

    viewHistory() {
        this.setState({isViewHistoryVisible: !this.state.isViewHistoryVisible});
    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    render() {
        const {
            urlObject,
            isLoading,
            isModalVisible,
            loggedUserObj,
            result,
            isViewHistoryVisible,
            oldUrlResults
        } = this.state;

        return (
            <Fragment>
                <ModalContainer
                    title={MessageConstants.SEARCH_URL_WARNING_MESSAGE}
                    yesClick={this.modalYesClick}
                    noClick={this.modalNoClick}
                    isModalVisible={isModalVisible}
                    modalType={AppConstants.CONFIRMATION_MODAL}/>
                <LoadingScreen isDisplay={isLoading} message={MessageConstants.LOADING_MESSAGE}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              viewHistory={this.viewHistory}
                              addJob={this.redirectToAddJob}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }

                <div className="root-container">
                    <div className="logo-div">
                        <img className="logo-img" src="./assets/img/logo.png"/>
                    </div>
                    <form name="site-add-form">
                        <div className={
                                'input-group has-feedback ' +
                                ((urlObject.error.hasError !== undefined)
                                    ? ((urlObject.error.hasError) ? 'has-error' : 'has-success') : '')
                            }>
                            <span className="input-group-addon">
                                http://
                            </span>
                            <input
                                value={urlObject.value}
                                onChange={(e) => this.handleChange(e, {
                                    urlObject: {
                                        value: e.target.value,
                                        error: {
                                            hasError: UIHelper.isUrlHasError(e.target.value),
                                            name: MessageConstants.URL_ERROR
                                        }
                                    }
                                })}
                                onKeyPress={this.searchKeyPress}
                                type="text"
                                disabled={(isLoading)? 'disabled' : ''}
                                className="form-control"
                                id="urlObjectInput"
                                placeholder="URL"/>
                            <span className="input-group-addon"
                                onClick={this.searchClick}>
                                <i className="glyphicon glyphicon-search"></i>
                            </span>
                        </div>
                        <ErrorMessageComponent error={urlObject.error}/>
                        {
                            result.isResultRecieved
                                ? <div className="result-container">
                                      <a className="btn btn-primary" href="#"
                                          onClick={(e) => this.viewResult(e, result)}>
                                          View Result for {result.searchedUrl}
                                      </a>
                                  </div>
                                : null
                        }
                    </form>
                </div>
                {
                    (isViewHistoryVisible)
                        ? (oldUrlResults.length !== 0)
                            ? <Fragment>
                                 <h4 className="history-view">View History</h4>
                                 <Panel expanded={isViewHistoryVisible} className="history-view">
                                     <Panel.Collapse>
                                         <Panel.Body className="history-view container">
                                            <table className="table table-bordered">
                                                <thead>
                                                    <tr>
                                                        <th>Site URL</th>
                                                        <th>Scheduled Date and Time</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        oldUrlResults.map((oldUrlResult, i) => {
                                                            return <tr className="table-row" key={'urlResult' + i}>
                                                                        <td className="table-cell">
                                                                            {oldUrlResult.url}
                                                                        </td>
                                                                        <td className="table-cell">
                                                                            {moment(oldUrlResult.dateTime)
                                                                                .format(AppConstants.DATE_FORMAT)}
                                                                        </td>
                                                                        <td>
                                                                            <button
                                                                                className="btn-primary form-control"
                                                                                onClick={
                                                                                    (e) => this.viewResult(e,
                                                                                        oldUrlResult)
                                                                                }>
                                                                                Result
                                                                            </button>
                                                                        </td>
                                                                    </tr>;
                                                        })
                                                    }
                                                </tbody>
                                            </table>
                                         </Panel.Body>
                                     </Panel.Collapse>
                                 </Panel>
                              </Fragment>
                            : <h4 className="history-view">You don't have search history</h4>
                        : null
                }

            </Fragment>
        );
    }
}

SiteAdd.propTypes = {
};

export default SiteAdd;
