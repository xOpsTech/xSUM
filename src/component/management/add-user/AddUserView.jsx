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
import Styles from './AddUserStyles.less';
/* eslint-enable no-unused-vars */

class AddUserView extends React.Component {
    constructor(props) {
        super(props);

        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getAllUserRoles = this.getAllUserRoles.bind(this);
        this.addUserClick = this.addUserClick.bind(this);
        this.updateUserClick = this.updateUserClick.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'User Add - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});

            this.getAllUserRoles(loggedUserObject);
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
            userRoles: [],
            userObj: {
                id: '',
                email: {value: '', error: {}},
                password: {value: '', error: {}},
                role: {value: ''}
            },
            userList: [],
            userSaveError: {},
            tenantList: [],
            selectedTenant: {userList: []},
        };

        return initialState;
    }

    getAllUserRoles(loggedUserObj) {
        var urlToGetUserRoles = Config.API_URL + AppConstants.GET_USER_ROLES_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_USER_ROLES});
        userApi.getUserList(urlToGetUserRoles, {}).then((data) => {
            var userObj = this.state.userObj;
            userObj.role.value = data.userRoles[0].type;
            this.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    userRoles: data.userRoles,
                    userObj: userObj
                }
            );
        });

        var urlToGetUsers = Config.API_URL + AppConstants.GET_USER_LIST_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_USERS});
        userApi.getUserList(urlToGetUsers, {userEmail: loggedUserObj.email}).then((data) => {

            if (this.props.location.query.userObj) {
                var userObj = JSON.parse(this.props.location.query.userObj);

                for (var i = 0; i < data.userData.length; i++) {

                    if (userObj.userID === data.userData[i]._id) {

                        this.setState(
                            {
                                userObj: {
                                    id: data.userData[i]._id,
                                    email: {value: data.userData[i].email, error: {}},
                                    role: {
                                        value:
                                            UIHelper.getRoleForUserFromTenant(
                                                userObj.tenantID,
                                                data.userData[i],
                                                false
                                            )
                                    },
                                    tenants: data.userData[i].tenants
                                }
                            }
                        );
                    }

                }

            }

            this.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    userList: data.userData
                }
            );
        });
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    getAllTenantsData(user, context) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANT_DATA_API;
        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS});
        tenantApi.getAllTenantsFrom(urlToGetTenantData, {userID: user._id}).then((data) => {
            var tenantList = [];
            var selectedTenant = context.state.selectedTenant;

            for (var i = 0; i < data.length; i++) {
                var tenant = data[i];
                tenant.email = {value: data[i].email, error: {}};
                tenant.password = {value: '', error: {}};
                tenantList.push(tenant);

                if (context.props.location.query.userObj) {
                    var userObj = JSON.parse(context.props.location.query.userObj);

                    if (userObj.tenantID === tenant._id) {
                        selectedTenant = tenant;
                    }

                }

            }

            if (selectedTenant) {
                selectedTenant = tenantList[0];
            }

            context.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    tenantList: tenantList,
                    selectedTenant: selectedTenant
                }
            );

        });
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    addUserClick(e) {
        e.preventDefault();

        var {userObj, selectedTenant, loggedUserObj} = this.state;

        if (loggedUserObj.isEmailPasswordSet) {

            var undefinedCheck = !(userObj.email.error.hasError === undefined);
            var errorCheck = !(userObj.email.error.hasError);

            if (undefinedCheck && errorCheck) {
                this.setState({isLoading: true, loadingMessage: MessageConstants.ADD_USER});
                var userToInsert = {
                    userID: loggedUserObj.id,
                    email: userObj.email.value,
                    password: userObj.password.value,
                    role: userObj.role.value,
                    tenantID: selectedTenant._id,
                    siteURL: Config.API_URL,
                    loggedUserEmail: loggedUserObj.email
                };

                var urlToAddUser = Config.API_URL + AppConstants.ADD_USER_API;
                userApi.registerUser(urlToAddUser, userToInsert).then((response) => {
                    this.setState(
                        {
                            isLoading: false,
                            loadingMessage: '',
                        }
                    );

                    if (response.message === AppConstants.RESPONSE_SUCCESS) {
                        UIHelper.redirectTo(AppConstants.USER_MANAGMENT_ROUTE, {});
                    } else {
                        this.setState({userSaveError: {hasError: true, name: response.message}});
                    }

                });
            } else {

                if(userObj.email.error.hasError === undefined) {
                    userObj.email.error.hasError = true;
                    userObj.email.error.name = MessageConstants.EMAIL_ERROR;
                    this.setState({userObj});
                }

            }

        } else {
            this.setState({userSaveError: {hasError: true, name: MessageConstants.ADD_USER_TENANT_EMAIL_CONFIG_MESSAGE}});
        }

    }

    updateUserClick(e) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.UPDATE_USER});
        var {userObj, selectedTenant} = this.state;

        var userToUpdate = {
            id: userObj.id,
            email: userObj.email.value,
            role: userObj.role.value,
            tenantID: selectedTenant._id,
            tenants: userObj.tenants
        };

        var urlToUpdateUser = Config.API_URL + AppConstants.UPDATE_USER_API;
        userApi.registerUser(urlToUpdateUser, userToUpdate).then((response) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                }
            );

            if (response.message === AppConstants.RESPONSE_SUCCESS) {
                UIHelper.redirectTo(AppConstants.USER_MANAGMENT_ROUTE, {});
            } else {
                this.setState({userSaveError: {hasError: true, name: response.message}});
            }

        });
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
            userObj,
            userRoles,
            userSaveError,
            tenantList,
            selectedTenant
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav
                    selectedIndex={AppConstants.USER_MANAGMENT_INDEX}
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
                            {
                                (userObj.id) ? 'Update User' : 'Add User'
                            }
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
                                    ((userObj.email.error.hasError !== undefined)
                                        ? ((userObj.email.error.hasError) ? 'has-error' : 'has-success') : '')
                                    }>
                                    <input
                                        value={userObj.email.value}
                                        onChange={(e) => {
                                            userObj.email =  {
                                                value: e.target.value,
                                                error: {
                                                    hasError: UIHelper.isEmailHasError(e.target.value),
                                                    name: MessageConstants.EMAIL_ERROR
                                                }
                                            }
                                            this.handleChange(e, {
                                                userObj
                                            });
                                        }}
                                        type="text"
                                        className="form-control"
                                        id="userEmailInput"
                                        placeholder="EMAIL"/>
                                    <ErrorMessageComponent error={userObj.email.error}/>
                                </div>
                            </div>
                        </div>

                        {
                            (userObj.id)
                                ? null
                                : <div className="row">
                                    <div className="col-sm-3 alert-label-column">
                                        <div className="form-group label-text">
                                            <label className="control-label">User's Password</label>
                                        </div>
                                    </div>
                                    <div className="col-sm-9">
                                        <div className={
                                            'form-group has-feedback ' +
                                            ((userObj.password.error.hasError !== undefined)
                                                ? ((userObj.password.error.hasError) ? 'has-error' : 'has-success') : '')
                                            }>
                                            <input
                                                value={userObj.password.value}
                                                onChange={(e) => {
                                                    userObj.password =  {
                                                        value: e.target.value,
                                                        error: {}
                                                    }
                                                    this.handleChange(e, {
                                                        userObj
                                                    });
                                                }}
                                                type="password"
                                                className="form-control"
                                                id="userPasswordInput"
                                                placeholder="PASSWORD"/>
                                            <ErrorMessageComponent error={userObj.password.error}/>
                                        </div>
                                    </div>
                                  </div>
                        }

                        <div className="row">
                            <div className="col-sm-3 alert-label-column">
                                <div className="form-group label-text">
                                    <label className="control-label">User Role</label>
                                </div>
                            </div>
                            <div className="col-sm-9">
                                <select
                                      className="form-control form-control-sm form-group"
                                      value={userObj.role.value}
                                      onChange={(e) => {
                                          userObj.role.value = e.target.value;
                                          this.handleChange(e, {userObj});
                                      }}>
                                      {
                                          userRoles.map((userRole, i) => {
                                              return <option key={'role_' + i} value={userRole.type}>
                                                        {UIHelper.toTitleCase(userRole.type)}
                                                    </option>;
                                          })
                                      }
                                </select>
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

                        <ErrorMessageComponent error={userSaveError}/>
                        <div className="row">
                            <div className="col-sm-4 alert-label-column">
                            </div>
                            <div className="col-sm-8 alert-label-column">
                                <div className="form-group">
                                    {
                                        (userObj.id)
                                            ? <button
                                                  className="btn btn-primary form-control half-button button-all-caps-text"
                                                  onClick={(e) => this.updateUserClick(e)}>
                                                  Update User
                                              </button>
                                            : <button
                                                  className="btn btn-primary form-control half-button button-all-caps-text"
                                                  onClick={(e) => this.addUserClick(e)}>
                                                  Add User
                                            </button>
                                    }

                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </Fragment>
        );
    }
}

AddUserView.propTypes = {
};

export default AddUserView;
