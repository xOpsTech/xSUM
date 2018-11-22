import React, {Fragment} from 'react';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import NavContainer from '../../common/nav-container/NavContainer';
import LeftNav from '../../common/left-nav/LeftNav';
import userApi from '../../../api/userApi';

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

            this.getAllUsers(loggedUserObject);
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
            userList: []
        };

        return initialState;
    }

    getAllUsers(loggedUserObj) {
        var urlToGetUsers = Config.API_URL + AppConstants.GET_USER_LIST_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_USERS});
        userApi.getUserList(urlToGetUsers, {userEmail: loggedUserObj.email}).then((data) => {
            this.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    userList: data.userData
                }
            );
        });
    }

    updateUserClick(e, userToUpdate, index) {
        e.preventDefault();

        UIHelper.redirectTo(AppConstants.USER_VIEW_ROUTE, {
            userObj: JSON.stringify({userID: userToUpdate._id})
        });
    }

    removeUserClick(e, userToRemove) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.REMOVING_USER});
        var url = Config.API_URL + AppConstants.USER_REMOVE_API;
        userApi.removeUser(url, {userId: userToRemove._id}).then(() => {
            let arrayAfterRemove = this.state.userList.filter((userObj) => {
                return userObj._id !== userToRemove._id;
            });
            this.setState({isLoading: false, loadingMessage: '', userList: arrayAfterRemove});
        });
    }

    redirectToAddUser() {
        UIHelper.redirectTo(AppConstants.USER_VIEW_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isLeftNavCollapse,
            userList
        } = this.state;

        const UserList = () => {
            return (
                <table className="table table-borderless" id="user-list">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>User Email Address</th>
                            <th>User Role</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            userList.map((user, i) => {
                                return (
                                    <tr className="table-row" key={'userDetail' + i}>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback label-div">
                                                <label className="alert-label">
                                                    {user._id}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback label-div">
                                                <label className="alert-label">
                                                    {user.email}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback label-div">
                                                <label className="alert-label">
                                                    {user.role}
                                                </label>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-primary form-control button-inline"
                                                onClick={(e) => this.updateUserClick(e, user, i)}
                                                title={'Update user details of ' + user.email}>
                                                <span className="glyphicon button-icon glyphicon-edit">
                                                </span>
                                            </button>
                                            {
                                                (user.email !== loggedUserObj.email)
                                                    ? <button
                                                        className="btn-danger form-control button-inline"
                                                        onClick={(e) => this.removeUserClick(e, user)}
                                                        title={'Remove user of ' + user.email}>
                                                        <span className="glyphicon glyphicon-remove button-icon">
                                                        </span>
                                                      </button>
                                                    : null
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
                              loggedUserObj={loggedUserObj}/>
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
