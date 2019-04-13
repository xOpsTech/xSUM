import React, { Fragment } from 'react';
import axios from 'axios';

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
        this.getAllTenantsData = this.getAllTenantsData.bind(this);
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
            var usr = this.state.loggedUserObj;
            usr.email = loggedUserObject.email;
            this.setState({ loggedUserObj: usr });
            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectLogin();
        }
        this.setState({ isLeftNavCollapse: UIHelper.getLeftState() });
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: {
                email: '',
                title: '',
                company: '',
                location: '',
                name: '',
                timeZone: '',
                password: '',
                picture: ''

            },
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

    updateValue(e) {
        var usr = this.state.loggedUserObj

        usr[this.state.selectedPopup] = e;
        this.setState({
            loggedUserObj: usr,
            isHidden: !this.state.isHidden
        });
        this.saveProfile();
    }
    updatePicture(e) {
        var usr = this.state.loggedUserObj
        usr.picture = e;
        this.setState({
            loggedUserObj: usr,
            isHidden: !this.state.isHidden
        });
        this.saveProfile();
    }
    deletePicture() {
      var usr = this.state.loggedUserObj
      axios.post(Config.API_URL + AppConstants.DELETE_PICTURE, {
          name: this.state.loggedUserObj.picture
      })
      .then(res => { // then print response status
        console.log(res.statusText);
      })
      usr.picture = null;
      this.setState({
          loggedUserObj: usr,
      });
      this.saveProfile();
    }
    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    getUserCompany(id) {
        this.setState({ isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS });
        var url = Config.API_URL + AppConstants.GET_COMPANY_NAME;
        tenantApi.getAllTenantsFrom(url, {id: id}).then((response) => {
            var usr = this.state.loggedUserObj;
            usr.company = response.name;
            this.setState(
                {
                    loggedUserObj: usr,
                    isLoading: false,
                    loadingMessage: '',
                }
            );
        });
    }

    getAllTenantsData(user, context) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANT_DATA_API;
        context.setState({ isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS });
        this.getUserCompany(user._id);
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
    saveProfile() {
        this.setState({ isLoading: true, loadingMessage: MessageConstants.UPDATE_PROFILE });

        var url = Config.API_URL + AppConstants.UPDATE_PROFILE_API;
        userApi.updateUser(url, this.state.loggedUserObj).then((response) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                }
            );
        });
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
                    isSubSectionExpand={true}
                    subSectionIndex={AppConstants.MANAGEMENT_INDEX}/>
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
                    update={this.updateValue.bind(this)}
                    updatePic={this.updatePicture.bind(this)}
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
                                    <img className="profile-picture"
                                        src={
                                            (this.state.loggedUserObj.picture)
                                            ? "../../../../assets/img/filePicture/" + this.state.loggedUserObj.picture
                                            : "../../../../assets/img/missing.png"
                                        }/>
                                    <button
                                        className="btn btn-outline-danger form-control button-all-caps-text  picture-change"
                                        onClick={this.deletePicture.bind(this)}>
                                        Remove Picture
                                    </button>
                                    <button className="btn btn-primary form-control button-all-caps-text picture-change"
                                            onClick={this.togglePopup.bind(this, "picture")}>
                                            Change Picture
                                    </button>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "name")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Name</label>
                                    </div>
                                </div>
                                <div className="col-sm-9" >
                                    <p className="profile-label">
                                    {loggedUserObj.name}
                                    </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Email</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                        {loggedUserObj.email}
                                    </p>
                                </div>
                            </div>
                            <div className="row profile-row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Company</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                    {loggedUserObj.company}
                                    </p>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "title")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Title</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                    {loggedUserObj.title}
                                     </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "location")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Location</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                    {loggedUserObj.location}
                                    </p>
                                    <i class="fas fa-edit edit-icon"></i>
                                </div>
                            </div>
                            <div className="row profile-row" onClick={this.togglePopup.bind(this, "timeZone")}>
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Time Zone</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <p className="profile-label">
                                    {loggedUserObj.timeZone}
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
                                                        onClick={this.togglePopup.bind(this, "password")}>
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
