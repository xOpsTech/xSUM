import React, { Fragment } from 'react';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import ErrorMessageComponent from '../../common/error-message-component/ErrorMessageComponent';
import NavContainer from '../../common/nav-container/NavContainer';
import LeftNav from '../../common/left-nav/LeftNav';
import userApi from '../../../api/userApi';
import tenantApi from '../../../api/tenantApi';
import ProfilePopup from "./profile-popups/ProfilePopup.jsx";

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './ProfileStyles.less';
/* eslint-enable no-unused-vars */

class ProfileView extends React.Component {
    constructor(props) {
        super(props);

        this.updateMailClick = this.updateMailClick.bind(this);
        this.redirectToAddUser = this.redirectToAddUser.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);

        // Setting initial state objects
        this.state = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Profile - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({ loggedUserObj: loggedUserObject });

            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

        this.setState({ isLeftNavCollapse: UIHelper.getLeftState() });
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            isLeftNavCollapse: false,
            isHidden: true,
            selectedPopup: "",
            tenantList: [],
            selectedTenant: {
                email: { value: '', error: {} },
                password: { value: '', error: {} },
                name: { value: '', error: {} }
            },
            profileObj: {
                emailPassword: { value: '', error: {} }
            }
        };

        return initialState;
    }

    togglePopup(id) {
        this.setState({
            isHidden: !this.state.isHidden,
            selectedPopup: id
        })
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    getAllTenantsData(user, context) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANT_DATA_API;
        context.setState({ isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS });
        tenantApi.getAllTenantsFrom(urlToGetTenantData, { userID: user._id }).then((data) => {

            var tenantList = [];

            for (var i = 0; i < data.length; i++) {
                var tenant = data[i];
                tenant.email = { value: data[i].email, error: {} };
                tenant.password = { value: '', error: {} };
                tenant.name = { value: data[i].name, error: {} };
                tenantList.push(tenant);
            }

            context.setState(
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

        this.setState({ isLoading: true, loadingMessage: MessageConstants.UPDATE_PROFILE });
        var { profileObj, loggedUserObj } = this.state;

        var emailSettingToInsert = {
            id: loggedUserObj._id,
            email: loggedUserObj.email,
            emailPassword: profileObj.emailPassword.value
        };

        var urlToUpdateProfile = Config.API_URL + AppConstants.SET_EMAIL_PASSWORD_API;
        userApi.updateUser(urlToUpdateProfile, emailSettingToInsert).then((response) => {
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
        this.setState({ isLeftNavCollapse: !this.state.isLeftNavCollapse });
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
            selectedTenant,
            profileObj,
            selectedPopup
        } = this.state;

        /*
                <div className="col-sm-9">
                    <div className="form-group">
                        <input
                            value={profileObj.emailPassword.value}
                            onChange={(e) => {
                                profileObj.emailPassword = {
                                    value: e.target.value
                                }
                                this.handleChange(e, { profileObj });
                            }}
                            type="password"
                            className="form-control"
                            id="passwordInput"
                            placeholder="PASSWORD" />
                    </div>
                </div>
        */
        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage} />
                <LeftNav
                    selectedIndex={AppConstants.USER_PROFILE_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                    isSubSectionExpand={true} />
                {
                    (loggedUserObj)
                        ? <NavContainer
                            loggedUserObj={loggedUserObj}
                            isFixedNav={true} />
                        : <div className="sign-in-button">
                            <button onClick={() => { UIHelper.redirectTo(AppConstants.LOGIN_ROUTE); }}
                                className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                Sign in
                              </button>
                        </div>
                }

                {!this.state.isHidden && <ProfilePopup
                    selectedPopup={selectedPopup}
                    closePopup={this.togglePopup.bind(this)}
                />}
                <div className="site-edit-container">
                    <div className={
                        'table-container-div ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>

                        <div className="row alert-list-wrap-div settings-section">
                            <div className="row">
                                <div className="col-sm-3 alert-label-column section-head">
                                    <h4 className="site-add-title">
                                        Profile Settings
                                    </h4>
                                </div>
                            </div>
                            <div className="row profile-row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Profile Picture</label>
                                    </div>
                                </div>
                                <div className="col-sm-9" >
                                    <img className="profile-picture" src="../../../../assets/img/missing.png" />
                                    <button className="btn btn-outline-danger form-control button-all-caps-text  picture-change"> Remove Picture </button>
                                    <button className="btn btn-primary form-control button-all-caps-text picture-change"> Change Picture </button>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "Name")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Name</label>
                                    </div>
                                </div>
                                <div className="col-sm-9" >
                                    <p className="profile-label">
                                        Jane Smith
                                    </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "Email")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Email</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                        {loggedUserObj.email}
                                    </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "Company")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Company</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                        xOps
                                    </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "Title")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Title</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                        Developer
                                     </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "Location")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Location</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                        Earth
                                    </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "TimeZone")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Time Zone</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                        GMT +- ?
                                    </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row">
                                {
                                    (loggedUserObj.permissions && loggedUserObj.permissions.canUpdate)
                                        ? <div className="row">
                                            <div className="col-sm-4 alert-label-column">
                                            </div>
                                            <div className="col-sm-3 alert-label-column">
                                                <div className="form-group">
                                                    <button
                                                        className="btn btn-primary form-control button-all-caps-text" id="password-change"
                                                        onClick={this.togglePopup.bind(this, "Password")}>
                                                        Change Password
                                                </button>
                                                </div>
                                            </div>
                                        </div>
                                        : null
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

ProfileView.propTypes = {
};

export default ProfileView;
