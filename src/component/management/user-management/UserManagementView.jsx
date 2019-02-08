import React, {Fragment} from 'react';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import NavContainer from '../../common/nav-container/NavContainer';
import LeftNav from '../../common/left-nav/LeftNav';
import userApi from '../../../api/userApi';
import tenantApi from '../../../api/tenantApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './UserManagementViewStyles.less';
/* eslint-enable no-unused-vars */

class UserManagementView extends React.Component {
    constructor(props) {
        super(props);

        this.updateUserClick = this.updateUserClick.bind(this);
        this.removeUserClick = this.removeUserClick.bind(this);
        this.redirectToAddUser = this.redirectToAddUser.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.getAllTenantsWithUsers = this.getAllTenantsWithUsers.bind(this);
        this.tenantDropDown = this.tenantDropDown.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'User Management - ' + AppConstants.PRODUCT_NAME;
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
            selectedTenant: {userList: []},
            selectedTenantIndex: 0
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, (user, context) => {

            if (!user.permissions.canCreate || !user.permissions.canUpdate) {
                UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE);
            } else {
                context.getAllTenantsWithUsers(user, context);
            }

        });
    }

    getAllTenantsWithUsers(user, context) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANTS_WITH_USERS_API;

        if (user.isSuperUser) {
            urlToGetTenantData = Config.API_URL + AppConstants.GET_ALL_USERS_WITH_TENANTS_API;
        }

        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS});
        tenantApi.getAllTenantsFrom(urlToGetTenantData, {userID: user._id}).then((data) => {

            if (user.isSuperUser) {
                var selectedTenantID = UIHelper.getLocalStorageValue(AppConstants.SELECTED_TENANT_ID);
                var selectedTenant;
                var selectedTenantIndex = 0;

                if (selectedTenantID) {

                    for (let tenant of data) {

                        if (tenant._id === selectedTenantID) {
                            selectedTenant = tenant;
                            break;
                        }

                        selectedTenantIndex++;
                    }

                } else {
                    selectedTenant = data[0];
                }

                context.setState (
                    {
                        isLoading: false,
                        loadingMessage: '',
                        selectedTenant: selectedTenant,
                        selectedTenantIndex: selectedTenantIndex,
                        tenantList: data
                    }
                );

            } else {
                context.setState (
                    {
                        isLoading: false,
                        loadingMessage: '',
                        selectedTenant: data[0],
                        tenantList: data
                    }
                );
            }

        });
    }

    updateUserClick(e, userToUpdate) {
        e.preventDefault();

        const {selectedTenant} = this.state;

        UIHelper.redirectTo(AppConstants.ADD_USER_ROUTE, {
            userObj: JSON.stringify({userID: userToUpdate._id, tenantID: selectedTenant._id})
        });
    }

    removeUserClick(e, userToRemove) {
        e.preventDefault();

        const {selectedTenant, tenantList, loggedUserObj} = this.state;
        this.setState({isLoading: true, loadingMessage: MessageConstants.REMOVING_USER});
        var url = Config.API_URL + AppConstants.USER_REMOVE_API;
        userApi.removeUser(url, {userID: userToRemove._id, tenantID: selectedTenant._id}).then(() => {
            this.setState({isLoading: false, loadingMessage: ''});
            this.getAllTenantsWithUsers(loggedUserObj, this);
        });
    }

    redirectToAddUser() {
        UIHelper.redirectTo(AppConstants.ADD_USER_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    tenantDropDown(stateObject) {
        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        this.setState(stateObject);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isLeftNavCollapse,
            selectedTenant,
            selectedTenantIndex,
            tenantList
        } = this.state;

        const UserList = () => {
            return (
                <table className="table table-striped table-dark" id="user-list">
                    <thead>
                        <tr>
                            <th>User Email Address</th>
                            <th>User Role</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            selectedTenant.userList.map((user, i) => {
                                return (
                                    <tr className="table-row" key={'userDetail' + i}>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label>
                                                    {user.email}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label>
                                                    {UIHelper.getRoleForUserFromTenant(selectedTenant._id, user, true)}
                                                </label>
                                            </div>
                                        </td>
                                        <td>
                                            {
                                                (user.email !== loggedUserObj.email)
                                                    ? <Fragment>
                                                        <button
                                                            className="btn-primary form-control button-inline"
                                                            onClick={(e) => this.updateUserClick(e, user)}
                                                            title={'Update user details of ' + user.email}>
                                                            <span className="glyphicon button-icon glyphicon-edit">
                                                            </span>
                                                        </button>
                                                        <button
                                                            className="btn-danger form-control button-inline"
                                                            onClick={(e) => this.removeUserClick(e, user)}
                                                            title={'Remove user of ' + user.email}>
                                                            <span className="glyphicon glyphicon-remove button-icon">
                                                            </span>
                                                          </button>
                                                      </Fragment>
                                                    : <div className="form-group has-feedback">
                                                          Current user
                                                      </div>
                                            }
                                        </td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            );
        };

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
                <div className="site-edit-container">
                    <div className = {
                        'table-container-div ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                        <div className="row alert-list-wrap-div">
                            <div className="row">
                                <div className="col-sm-2 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Select Account : </label>
                                    </div>
                                </div>
                                <div className="col-sm-2 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Account Name</label>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="form-group">
                                        <select className="form-control form-control-sm form-group"
                                            value={selectedTenantIndex}
                                            onChange={(e) => this.tenantDropDown(
                                                  {
                                                      selectedTenant: tenantList[e.target.value],
                                                      selectedTenantIndex: e.target.value
                                                  })
                                            }>
                                            {
                                                tenantList.map((tenant, i) => {
                                                    return <option key={'tenant_' + i} value={i}>
                                                                {tenant.name}
                                                           </option>;
                                                })
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <UserList/>
                            <div className="row add-test-section">
                                <div className="col-sm-2 table-button">
                                    <button
                                        className="btn btn-primary form-control button-all-caps-text add-button"
                                        onClick={this.redirectToAddUser}>
                                        Add User
                                    </button>
                                </div>
                                <div className="col-sm-11"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

UserManagementView.propTypes = {
};

export default UserManagementView;
