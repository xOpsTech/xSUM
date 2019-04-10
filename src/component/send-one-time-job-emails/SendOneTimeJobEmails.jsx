import React, {Fragment} from 'react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import ErrorIconComponent from '../common/error-icon-component/ErrorIconComponent';
import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LeftNav from '../common/left-nav/LeftNav';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './SendOneTimeJobEmailsStyles.less';
/* eslint-enable no-unused-vars */

class SendOneTimeJobEmails extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.sendEmail = this.sendEmail.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.tenantDropDown = this.tenantDropDown.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'One Test Email Send - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});
            UIHelper.getUserData(loggedUserObject, this, this.getAllTenantsData);
        } else {
            UIHelper.redirectLogin();
        }

        this.setState({isLeftNavCollapse: UIHelper.getLeftState()});
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            siteList: [],
            isLeftNavCollapse: false,
            selectedTenant: {userList: []},
            emailAddress: {value: '', error: {}}
        };

        return initialState;
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    getAllTenantsData(user, context) {
        UIHelper.getAllTenantsData(user, context, context.getAllJobs);
    }

    getAllJobs(loggedUserObj, selectedTenant, context) {
        var url = Config.API_URL + AppConstants.JOBS_GET_API;
        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        var objectToRetrieve = {
            tenantID: selectedTenant._id
        };
        jobApi.getAllJobsFrom(url, objectToRetrieve).then((data) => {
            context.setState({siteList: data, isLoading: false, loadingMessage: ''});
        });
    }

    sendEmail(e) {
        e.preventDefault();

        const {emailAddress, selectedTenant} = this.state;
        var url = Config.API_URL + AppConstants.SEND_ONE_TIME_JOB_EMAIL_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        var objectToRetrieve = {
            tenantID: selectedTenant._id,
            email: emailAddress.value
        };
        jobApi.updateJob(url, objectToRetrieve).then((data) => {
            this.setState({isLoading: false, loadingMessage: ''});
        });
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    tenantDropDown(stateObject) {
        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        this.setState(stateObject);

        this.getAllJobs(this.state.loggedUserObj, stateObject.selectedTenant, this);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isLeftNavCollapse,
            emailAddress
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav
                    selectedIndex={AppConstants.SEND_ONE_TIME_TEST_EMAIL_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              isFixedNav={true}
                              tenantDropDown={this.tenantDropDown}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div>
                    <div className={
                        'table-container-div ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                        <div className="row alert-list-wrap-div">
                            <h1 className="site-add-title">
                                Send one time test email
                            </h1>
                        </div>
                        <div className="row alert-list-wrap-div settings-section">
                            <div className="col-sm-3 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Email Address to send</label>
                                </div>
                            </div>
                            <div className="col-sm-9">
                                <div className={
                                    'form-group has-feedback ' +
                                    ((emailAddress.error.hasError !== undefined)
                                        ? ((emailAddress.error.hasError) ? 'has-error' : 'has-success') : '')
                                    }>
                                    <input
                                        value={emailAddress.value}
                                        onChange={(e) => {
                                            this.handleChange(e, {
                                                emailAddress: {
                                                    value: e.target.value,
                                                    error: {
                                                        hasError: UIHelper.isEmailHasError(e.target.value),
                                                        name: MessageConstants.EMAIL_ERROR
                                                    }
                                                }
                                            });
                                        }}
                                        type="email"
                                        className="form-control"
                                        id="emailInput"
                                        placeholder="EMAIL"/>
                                    <ErrorIconComponent error={emailAddress.error}/>
                                    <ErrorMessageComponent error={emailAddress.error}/>
                                </div>
                            </div>
                        </div>

                        <div className="row alert-list-wrap-div">
                            {
                                (loggedUserObj.permissions && loggedUserObj.permissions.canUpdate)
                                    ? <div className="row">
                                        <div className="col-sm-4 alert-label-column">
                                        </div>
                                        <div className="col-sm-3 alert-label-column">
                                            <div className="form-group">
                                                <button
                                                    className="btn btn-primary form-control button-all-caps-text"
                                                    onClick={(e) => this.sendEmail(e)}>
                                                    Send Email
                                                </button>
                                            </div>
                                        </div>
                                     </div>
                                    : null
                            }
                        </div>

                    </div>
                </div>
            </Fragment>
        );
    }
}

SendOneTimeJobEmails.propTypes = {
};

export default SendOneTimeJobEmails;
