import React, {Fragment} from 'react';
import {randomBytes} from 'crypto';
import {Panel} from 'react-bootstrap';

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
        document.title = "Site Load - xSum";
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
                let randomHash = randomBytes(10).toString('hex');

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
                        this.setState({result: {isResultRecieved: true, resultUrl: data[0].resultUrl, searchedUrl: data[0].url}});
                        // TODO: display result set(need to update the state of result array)
                    }
                });
            }

        }, 1000 * secondsToSendReq);
    }

    viewResult(e, redirectTo) {
        e.preventDefault();
        window.open(redirectTo, '_self');
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
                    isModalVisible={isModalVisible}/>
                <LoadingScreen isDisplay={isLoading} message={MessageConstants.LOADING_MESSAGE}/>
                {
                    (loggedUserObj)
                        ? <NavContainer loggedUserObj={loggedUserObj} viewHistory={this.viewHistory}/>
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
                                          onClick={(e) => this.viewResult(e, result.resultUrl)}>
                                          View Result for {result.searchedUrl}
                                      </a>
                                  </div>
                                : null
                        }
                    </form>
                </div>
                {
                    (isViewHistoryVisible)
                        ? <h4 className="history-view">View History</h4>
                        : null
                }
                <Panel expanded={isViewHistoryVisible} className="history-view">
                    <Panel.Collapse>
                        <Panel.Body className="history-view container">
                            {
                                oldUrlResults.map((oldUrlResult, i) => {
                                    return <div className="row url-result">
                                              <div className="col-xs-7 col-md-7">
                                                  {oldUrlResult.url}
                                              </div>
                                              <div className="col-xs-5 col-md-5">
                                                  <a className="btn btn-primary view-result-btn" href="#"
                                                      onClick={(e) => this.viewResult(e, oldUrlResult.resultUrl)}>
                                                      View Result
                                                  </a>
                                              </div>
                                           </div>;
                                })
                            }
                        </Panel.Body>
                    </Panel.Collapse>
                </Panel>
            </Fragment>
        );
    }
}

SiteAdd.propTypes = {
};

export default SiteAdd;
