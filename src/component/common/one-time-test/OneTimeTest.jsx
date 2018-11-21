import React, {Fragment} from 'react';

import ErrorMessageComponent from '../error-message-component/ErrorMessageComponent';
import LoadingScreen from '../loading-screen/LoadingScreen';
import ModalContainer from '../modal-container/ModalContainer';
import urlApi from '../../../api/urlApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as MessageConstants from '../../../constants/MessageConstants';
import * as UIHelper from '../../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './OneTimeTestStyles.less';
/* eslint-enable no-unused-vars */

class OneTimeTest extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange    = this.handleChange.bind(this);
        this.searchKeyPress  = this.searchKeyPress.bind(this);
        this.searchClick     = this.searchClick.bind(this);
        this.searchURL       = this.searchURL.bind(this);
        this.setStorageValue = this.setStorageValue.bind(this);
        this.insertToDB      = this.insertToDB.bind(this);
        this.loopToCheckUrl  = this.loopToCheckUrl.bind(this);
        this.viewResult      = this.viewResult.bind(this);
        this.modalYesClick   = this.modalYesClick.bind(this);
        this.modalNoClick    = this.modalNoClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentWillMount() {

        let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

        if (storageID) {
            this.setState({isModalVisible: true});
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            urlObject : {value:'', error: {}},
            isLoading: false,
            result: {isResultRecieved: false, resultUrl: '', searchedUrl: ''},
            isModalVisible: false
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

    insertToDB(randomHash) {
        let {urlObject, loggedUserObj} = this.state;

        var url, urlObj;

        // Check user logged in or not
        if (loggedUserObj) {
            url = Config.API_URL + AppConstants.URL_INSERT_LOGGED_USER_API;
            urlObj = {
                hashID: randomHash,
                urlValue: 'http://' + urlObject.value,
                userEmail: loggedUserObj.email
            };
        } else {
            url = Config.API_URL + AppConstants.URL_INSERT_API;
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

    setStorageValue(randomHash) {
        UIHelper.setLocalStorageValue(AppConstants.STORAGE_ID, randomHash);
    }

    loopToCheckUrl() {
        var secondsToSendReq = 2;
        var intervalUrl = setInterval(() => {

            let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

            if (storageID) {
                var url = Config.API_URL + AppConstants.URL_GET_API;
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

    render() {
        const {urlObject, result, isLoading, isModalVisible} = this.state;
        return (
            <Fragment>
                <ModalContainer
                    title={MessageConstants.SEARCH_URL_WARNING_MESSAGE}
                    yesClick={this.modalYesClick}
                    noClick={this.modalNoClick}
                    isModalVisible={isModalVisible}
                    modalType={AppConstants.CONFIRMATION_MODAL}/>
                <LoadingScreen isDisplay={isLoading} message={MessageConstants.LOADING_MESSAGE}/>
                <h3 className="search-text">
                    Run a one-time test
                </h3>
                <form name="site-add-form">
                    <div className={
                            'input-group has-feedback ' +
                            ((urlObject.error.hasError !== undefined)
                                ? ((urlObject.error.hasError) ? 'has-error' : 'has-success') : '')
                        }>
                        {
                            // <span className="input-group-addon">
                            //     http://
                            // </span>
                        }
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
                            placeholder="ENTER WEBSITE URL"/>
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
            </Fragment>
        );
    }
}

OneTimeTest.propTypes = {
};

export default OneTimeTest;
