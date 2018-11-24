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
            tenantList: []
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        var urlToGetUserData = Config.API_URL + AppConstants.GET_USER_DATA_API;
        var {mailSend} = this.state;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_USER});
        userApi.getUser(urlToGetUserData, {email: loggedUserObj.email}).then((data) => {

            if (data.user.settingEmail) {
                mailSend.email.value = data.user.settingEmail;
            }

            loggedUserObj.id = data.user._id;

            this.setState (
                {
                    mailSend,
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

            this.setState (
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
                <table className="table table-borderless" id="tenant-list">
                    <thead>
                        <tr>
                            <th>Tenant ID</th>
                            <th>Tenant Name</th>
                            <th>Tenant Email</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            tenantList.map((tenant, i) => {
                                return (
                                    <tr className="table-row" key={'userDetail' + i}>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback label-div">
                                                <label className="alert-label">
                                                    {tenant._id}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback label-div">
                                                <label className="alert-label">
                                                    {
                                                        (tenant.name === '')
                                                            ? 'Please add a name for tanent'
                                                            : tenant.name
                                                    }
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback label-div">
                                                <label className="alert-label">
                                                    {
                                                        (tenant.email === '')
                                                            ? 'Please add a email for tanent'
                                                            : tenant.email
                                                    }
                                                </label>
                                            </div>
                                        </td>
                                        <td>
                                            <Fragment>
                                                <button
                                                    className="btn-primary form-control button-inline"
                                                    onClick={(e) => this.updateTenantClick(e, tenant, i)}
                                                    title={'Update tenant details of ' + tenant.name}>
                                                    <span className="glyphicon button-icon glyphicon-edit">
                                                    </span>
                                                </button>
                                                <button
                                                    className="btn-danger form-control button-inline"
                                                    onClick={(e) => this.removeTenantClick(e, tenant)}
                                                    title={'Remove tenant of ' + tenant.name}>
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
                              isFixedNav={true}/>
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
                            <div className="row add-test-section">
                                <div className="col-sm-2 table-button">
                                    <button
                                        className="btn btn-primary form-control button-all-caps-text add-button"
                                        onClick={this.redirectToAddUser}>
                                        Add Tenant
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

TenantsView.propTypes = {
};

export default TenantsView;
