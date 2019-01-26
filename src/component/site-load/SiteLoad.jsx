import React, {Fragment} from 'react';
import {Panel} from 'react-bootstrap';
import moment from 'moment';

import GoogleLoginButton from '../common/google-login-button/GoogleLoginButton';
import NavContainer from '../common/nav-container/NavContainer';
import ModalContainer from '../common/modal-container/ModalContainer';
import LogoContainer from '../common/logo-container/LogoContainer';
import OneTimeTest from '../common/one-time-test/OneTimeTest';
import urlApi from '../../api/urlApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as MessageConstants from '../../constants/MessageConstants';
import * as UIHelper from '../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './SiteLoadStyles.less';
/* eslint-enable no-unused-vars */

class SiteAdd extends React.Component {
    constructor(props) {
        super(props);

        this.getLoggedUserUrlData = this.getLoggedUserUrlData.bind(this);
        this.viewHistory          = this.viewHistory.bind(this);
        this.redirectToAddJob     = this.redirectToAddJob.bind(this);
        this.closeResultModal     = this.closeResultModal.bind(this);
        this.googleResponseSuccess = this.googleResponseSuccess.bind(this);
        this.googleResponseFail    = this.googleResponseFail.bind(this);
        this.modalOkClick          = this.modalOkClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentWillMount() {

        if (this.props.location.query.userObj) {
            var loggedUserObject = JSON.parse(this.props.location.query.userObj);
            this.setState({loggedUserObj: loggedUserObject});
            this.getLoggedUserUrlData(loggedUserObject);
        }

    }

    componentDidMount() {
        document.title = 'Site Load - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'block';
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            loggedUserObj: null,
            oldUrlResults: [],
            isViewHistoryVisible: false,
            resultObject: null,
            isResultModalVisible: false,
            isAlertVisible: false,
            alertTitle: ''
        };

        return initialState;
    }

    getLoggedUserUrlData(loggedUserObj) {
        var url = Config.API_URL + AppConstants.URL_GET_LOGGED_USER_URL_API;
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

    closeResultModal() {
        this.setState({isResultModalVisible: false});
    }

    googleResponseSuccess(response) {
        var basicProfile = response.getBasicProfile();
        var userObject = JSON.stringify({
            name: basicProfile.getName(),
            email: basicProfile.getEmail(),
            profilePicPath: basicProfile.getImageUrl()
        });
        UIHelper.setCookie(AppConstants.SITE_LOGIN_COOKIE, userObject, AppConstants.LOGIN_COOKIE_EXPIRES);
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE, {});
        // this.setState({
        //     loggedUserObj: {
        //         name: basicProfile.getName(),
        //         email: basicProfile.getEmail(),
        //         profilePicPath: basicProfile.getImageUrl()
        //     }
        // });
    }

    googleResponseFail(response) {
        this.setState({isAlertVisible: true, modalTitle: 'Error'});
    }

    modalOkClick() {
        this.setState({isAlertVisible: false, modalTitle: ''});
    }

    render() {
        const {
            loggedUserObj,
            isViewHistoryVisible,
            oldUrlResults,
            resultObject,
            isResultModalVisible,
            isAlertVisible,
            modalTitle
        } = this.state;

        return (
            <Fragment>
                <ModalContainer
                    title={modalTitle}
                    okClick={this.modalOkClick}
                    isModalVisible={isAlertVisible}
                    modalType={AppConstants.ALERT_MODAL}/>
                <ModalContainer
                    title={MessageConstants.SEARCH_URL_WARNING_MESSAGE}
                    yesClick={this.modalYesClick}
                    noClick={this.modalNoClick}
                    modalType={AppConstants.CONFIRMATION_MODAL}/>
                <ModalContainer
                    title={MessageConstants.SITE_RESULT_MESSAGE}
                    closeClick={this.closeResultModal}
                    isModalVisible={isResultModalVisible}
                    modalType={AppConstants.RESULT_MODAL}
                    resultObject={resultObject}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              viewHistory={this.viewHistory}
                              addJob={this.redirectToAddJob}/>
                          : null
                }
                <LogoContainer/>
                <div className="site-load-container">
                    <OneTimeTest/>
                    <form name="site-add-form">
                        {
                            (!loggedUserObj)
                                ? <Fragment>
                                      <h3 className="search-text">
                                          Or
                                      </h3>
                                      <h3 className="search-text">
                                          Monitor your site 24/7
                                      </h3>
                                      <GoogleLoginButton
                                          googleResponseSuccess={this.googleResponseSuccess}
                                          googleResponseFail={this.googleResponseFail}/>
                                      </Fragment>
                                : null
                        }
                    </form>
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
                </div>
            </Fragment>
        );
    }
}

SiteAdd.propTypes = {
};

export default SiteAdd;
