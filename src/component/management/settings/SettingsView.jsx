import React, {Fragment} from 'react';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import ErrorMessageComponent from '../../common/error-message-component/ErrorMessageComponent';
import NavContainer from '../../common/nav-container/NavContainer';
import LeftNav from '../../common/left-nav/LeftNav';
import userApi from '../../../api/userApi';
import tenantApi from '../../../api/tenantApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './SettingsStyles.less';
/* eslint-enable no-unused-vars */

class SettingsView extends React.Component {
    constructor(props) {
        super(props);

        this.updateMailClick = this.updateMailClick.bind(this);
        this.redirectToAddUser = this.redirectToAddUser.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Settings - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});

            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

        this.setState({isLeftNavCollapse: UIHelper.getLeftState()});
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            isLeftNavCollapse: false,
            tenantList: [],
            selectedTenant: {
                email: {value: '', error: {}},
                password: {value: '', error: {}}
            }
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        var urlToGetUserData = Config.API_URL + AppConstants.GET_USER_DATA_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_USER});
        userApi.getUser(urlToGetUserData, {email: loggedUserObj.email}).then((data) => {

            loggedUserObj.id = data.user._id;

            this.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    loggedUserObj
                }
            );

            this.getAllTenantsData(data.user._id);
        });
    }

    getAllTenantsData(userID) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANT_DATA_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS});
        tenantApi.getAllTenantsFrom(urlToGetTenantData, {userID}).then((data) => {

            var tenantList = [];

            for (var i = 0; i < data.length; i++) {
                var tenant = data[i];
                tenant.email = {value: data[i].email, error: {}};
                tenant.password = {value: '', error: {}};
                tenantList.push(tenant);
            }

            this.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    tenantList: tenantList,
                    selectedTenant: tenantList[0]
                }
            );

        });
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    updateMailClick(e) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.UPDATE_TENANT});
        var {selectedTenant, loggedUserObj} = this.state;

        var emailSettingToInsert = {
            id: selectedTenant._id,
            email: selectedTenant.email.value,
            password: selectedTenant.password.value
        };

        var urlToUpdateTenant = Config.API_URL + AppConstants.ADD_TENANT_EMAIL_SETTING_DATA_API;
        tenantApi.saveTenant(urlToUpdateTenant, emailSettingToInsert).then((response) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                }
            );
        });
    }

    redirectToAddUser() {
        UIHelper.redirectTo(AppConstants.USER_VIEW_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isLeftNavCollapse,
            tenantList,
            selectedTenant
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav
                    selectedIndex={AppConstants.SETTINGS_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                    isSubSectionExpand={true}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div className="site-add-container">
                    <form
                        name="site-add-form"
                        method="post">
                        <h1 className="site-add-title">
                            Settings
                        </h1>
                        <div className="row">
                            <div className="col-sm-3 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">User's Email</label>
                                </div>
                            </div>
                            <div className="col-sm-9">
                                <div className={
                                    'form-group has-feedback ' +
                                    ((selectedTenant.email.error.hasError !== undefined)
                                        ? ((selectedTenant.email.error.hasError) ? 'has-error' : 'has-success') : '')
                                    }>
                                    <input
                                        value={selectedTenant.email.value}
                                        onChange={(e) => {
                                            selectedTenant.email =  {
                                                value: e.target.value,
                                                error: {
                                                    hasError: UIHelper.isEmailHasError(e.target.value),
                                                    name: MessageConstants.EMAIL_ERROR
                                                }
                                            }
                                            this.handleChange(e, {selectedTenant});
                                        }}
                                        type="text"
                                        className="form-control"
                                        id="userEmailInput"
                                        placeholder="EMAIL"/>
                                    <ErrorMessageComponent error={selectedTenant.email.error}/>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-3 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Email Password</label>
                                </div>
                            </div>
                            <div className="col-sm-9">
                                <div className="form-group">
                                    <input
                                        value={selectedTenant.password.value}
                                        onChange={(e) => {
                                            selectedTenant.password = {
                                                value: e.target.value
                                            }
                                            this.handleChange(e, {selectedTenant});
                                        }}
                                        type="password"
                                        className="form-control"
                                        id="passwordInput"
                                        placeholder="Password"/>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-3 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Tenant ID</label>
                                </div>
                            </div>
                            <div className="col-sm-9">
                                <div className="form-group">
                                    <select className="form-control form-control-sm form-group">
                                        onChange={(e) => this.dropDownClick(
                                              {selectedTenant: tenantList[e.target.value]})
                                        }>
                                        {
                                            tenantList.map((tenant, i) => {
                                                return <option key={'tenant_' + i} value={i}>
                                                            {tenant._id}
                                                       </option>;
                                            })
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-3 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">Tenant Name</label>
                                </div>
                            </div>
                            <div className="col-sm-9">
                                <div className="form-group has-feedback label-div">
                                    <label className="alert-label">
                                        {(selectedTenant.name) ? selectedTenant.name : '-'}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-4 alert-label-column">
                            </div>
                            <div className="col-sm-4 alert-label-column">
                                <div className="form-group">
                                    <button
                                        className="btn btn-primary form-control button-all-caps-text"
                                        onClick={(e) => this.updateMailClick(e)}>
                                        Update Email Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </Fragment>
        );
    }
}

SettingsView.propTypes = {
};

export default SettingsView;
