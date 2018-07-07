import React, {Fragment} from 'react';
import {randomBytes} from 'crypto';

import ErrorMessageComponent from '../common/ErrorMessageComponent';
import LoadingScreen from '../common/LoadingScreen';
import LoginContainer from '../common/login-container/LoginContainer';
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

        this.handleChange    = this.handleChange.bind(this);
        this.searchKeyPress  = this.searchKeyPress.bind(this);
        this.searchClick     = this.searchClick.bind(this);
        this.searchURL       = this.searchURL.bind(this);
        this.setStorageValue = this.setStorageValue.bind(this);
        this.insertToDB      = this.insertToDB.bind(this);
        this.loopToCheckUrl  = this.loopToCheckUrl.bind(this);
        this.modalYesClick   = this.modalYesClick.bind(this);
        this.modalNoClick    = this.modalNoClick.bind(this);

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

        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            loggedUserObj: {},
            urlValue : '',
            error    : {},
            isLoading: false,
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
            this.searchURL();
        }

    }

    searchURL() {

        let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

        if (storageID) {
            UIHelper.removeLocalStorageValue(AppConstants.STORAGE_ID);
        } else {
            let randomHash = randomBytes(10).toString('hex');

            // Store in backend
            this.insertToDB(randomHash);
        }

    }

    setStorageValue(randomHash) {
        UIHelper.setLocalStorageValue(AppConstants.STORAGE_ID, randomHash);
    }

    insertToDB(randomHash) {
        let {urlValue} = this.state;

        var url = AppConstants.API_URL + AppConstants.URL_INSERT_API;
        var urlObj = {hashID: randomHash, urlValue};

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

                        // TODO: display result set(need to update the state of result array)
                    }
                });
            }

        }, 1000 * secondsToSendReq);
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
        const {error, isLoading, isModalVisible, loggedUserObj} = this.state;

        return (
            <Fragment>
                <ModalContainer
                    title={MessageConstants.SEARCH_URL_WARNING_MESSAGE}
                    yesClick={this.modalYesClick}
                    noClick={this.modalNoClick}
                    isModalVisible={isModalVisible}/>
                <LoadingScreen isDisplay={isLoading} message={MessageConstants.LOADING_MESSAGE}/>
                <LoginContainer loggedUserObj={loggedUserObj}/>
                <div className="root-container">
                    <div className="logo-div">
                        <img className="logo-img" src="./assets/img/logo.png"/>
                    </div>
                    <form name="site-add-form">
                        <div className="input-group">
                            <input
                                value={this.state.urlValue}
                                onChange={(e) => this.handleChange(e, {urlValue: e.target.value})}
                                onKeyPress={this.searchKeyPress}
                                type="text"
                                disabled={(isLoading)? 'disabled' : ''}
                                className="form-control"
                                id="urlValueInput"
                                placeholder="URL"/>
                            <span className="input-group-addon"
                                onClick={this.searchClick}>
                                <i className="glyphicon glyphicon-search"></i>
                            </span>
                        </div>
                        <ErrorMessageComponent error={error}/>
                    </form>
                </div>
            </Fragment>
        );
    }
}

SiteAdd.propTypes = {
};

export default SiteAdd;
