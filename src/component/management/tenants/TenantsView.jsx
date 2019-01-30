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
import Styles from './TenantsViewStyles.less';
/* eslint-enable no-unused-vars */

class TenantsView extends React.Component {
    constructor(props) {
        super(props);

        this.updateTenantClick = this.updateTenantClick.bind(this);
        this.removeTenantClick = this.removeTenantClick.bind(this);
        this.redirectToAddUser = this.redirectToAddUser.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.tenantDropDown = this.tenantDropDown.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Tenants - ' + AppConstants.PRODUCT_NAME;
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
            selectedTenant: {userList: []}
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    getAllTenantsData(user, context) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANTS_WITH_USERS_API;

        if (user.isSuperUser) {
            urlToGetTenantData = Config.API_URL + AppConstants.GET_ALL_USERS_WITH_TENANTS_API;
        }
        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS});
        tenantApi.getAllTenantsFrom(urlToGetTenantData, {userID: user._id}).then((data) => {

            context.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    tenantList: data
                }
            );

        });
    }

    updateTenantClick(e, tenantToUpdate, index) {
        e.preventDefault();

        UIHelper.redirectTo(AppConstants.USER_VIEW_ROUTE, {
            tenantObj: JSON.stringify({tenantID: tenantToUpdate._id})
        });
    }

    removeTenantClick(e, tenantToRemove) {
        e.preventDefault();
    }

    redirectToAddUser() {
        UIHelper.redirectTo(AppConstants.USER_VIEW_ROUTE, {});
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
            tenantList
        } = this.state;

        const TenantList = () => {
            return (
                <table className="table table-bordered" id="tenant-list">
                    <thead>
                        <tr>
                            <th>Account Name</th>
                            <th>Account Email</th>
                            <th>Total Points</th>
                            <th>Points Remain</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            tenantList.map((tenant, i) => {
                                return (
                                    <tr className="table-row" key={'userDetail' + i}>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label className="alert-label">
                                                    {
                                                        (tenant.name === '')
                                                            ? AppConstants.NOT_AVAILABLE_TENANT_NAME
                                                            : tenant.name
                                                    }
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label className="alert-label">
                                                    {
                                                        (tenant.email === '')
                                                            ? AppConstants.NOT_AVAILABLE_EMAIL
                                                            : tenant.email
                                                    }
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label className="alert-label">
                                                    {tenant.points.totalPoints}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label className="alert-label">
                                                    {tenant.points.pointsRemain}
                                                </label>
                                            </div>
                                        </td>
                                        <td>
                                            <Fragment>
                                                <button
                                                    className="btn-danger form-control"
                                                    onClick={(e) => this.removeTenantClick(e, tenant)}
                                                    title={'Remove account of ' + tenant.name}>
                                                    <span className="glyphicon glyphicon-remove button-icon">
                                                    </span>
                                                </button>
                                            </Fragment>
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
                    selectedIndex={AppConstants.TENANTS_INDEX}
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
                            <TenantList/>
                            {
                                // <div className="row add-test-section">
                                //     <div className="col-sm-2 table-button">
                                //         <button
                                //             className="btn btn-primary form-control button-all-caps-text add-button"
                                //             onClick={this.redirectToAddUser}>
                                //             Add Account
                                //         </button>
                                //     </div>
                                //     <div className="col-sm-11"></div>
                                // </div>
                            }
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

TenantsView.propTypes = {
};

export default TenantsView;
