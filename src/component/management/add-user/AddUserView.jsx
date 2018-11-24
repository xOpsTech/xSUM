import React, {Fragment} from 'react';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import ErrorMessageComponent from '../../common/error-message-component/ErrorMessageComponent';
import NavContainer from '../../common/nav-container/NavContainer';
import LeftNav from '../../common/left-nav/LeftNav';
import userApi from '../../../api/userApi';

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
                role: {value: ''}
            },
            userList: [],
            userSaveError: {}
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
                                    role: {value: data.userData[i].role}
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

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    addUserClick(e) {
        e.preventDefault();

        // this.setState({isLoading: true, loadingMessage: MessageConstants.ADD_USER});
        // var {userObj} = this.state;
        //
        // var userToInsert = {
        //     email: userObj.email.value,
        //     role: userObj.role.value
        // };
        //
        // var urlToAddUser = Config.API_URL + AppConstants.ADD_USER_API;
        // userApi.registerUser(urlToAddUser, userToInsert).then((response) => {
        //     this.setState(
        //         {
        //             isLoading: false,
        //             loadingMessage: '',
        //         }
        //     );
        //
        //     if (response.message === AppConstants.RESPONSE_SUCCESS) {
        //         UIHelper.redirectTo(AppConstants.USER_MANAGMENT_ROUTE, {});
        //     } else {
        //         this.setState({userSaveError: {hasError: true, name: response.message}});
        //     }
        //
        // });
    }

    updateUserClick(e) {
        e.preventDefault();

        // this.setState({isLoading: true, loadingMessage: MessageConstants.UPDATE_USER});
        // var {userObj} = this.state;
        //
        // var userToInsert = {
        //     id: userObj.id,
        //     email: userObj.email.value,
        //     role: userObj.role.value
        // };
        //
        // var urlToUpdateUser = Config.API_URL + AppConstants.UPDATE_USER_API;
        // userApi.registerUser(urlToUpdateUser, userToInsert).then((response) => {
        //     this.setState(
        //         {
        //             isLoading: false,
        //             loadingMessage: '',
        //         }
        //     );
        //
        //     if (response.message === AppConstants.RESPONSE_SUCCESS) {
        //         UIHelper.redirectTo(AppConstants.USER_MANAGMENT_ROUTE, {});
        //     } else {
        //         this.setState({userSaveError: {hasError: true, name: response.message}});
        //     }
        //
        // });
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
            userObj,
            userRoles,
            userSaveError
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
