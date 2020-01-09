import React, {Fragment} from 'react';

import ModalContainer from '../../common/modal-container/ModalContainer';
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
import Styles from './AllAccountView.less';
/* eslint-enable no-unused-vars */



class AllAccountView extends React.Component {
    constructor(props) {
        super(props);

        this.updateTenantClick  = this.updateTenantClick.bind(this);
        this.removeTenantClick  = this.removeTenantClick.bind(this);
        this.redirectToAddUser  = this.redirectToAddUser.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.tenantDropDown     = this.tenantDropDown.bind(this);
        this.modalYesClick      = this.modalYesClick.bind(this);
        this.modalNoClick       = this.modalNoClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
        
    }

    componentDidMount() {
        document.title = 'Tenants - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    //Display the sidenavbar
    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});
            //displaying the to the table
          this.getLoggedUserData(loggedUserObject);
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
            isLeftNavCollapse: false,
            tenantList: [],
            selectedTenant: {userList: []},
            isModalVisible: false,
            modalText: '',
            tenantToRemove: null,
            data: []
        };

        return initialState;
        

    }
 
    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
        //UIHelper.getALLAccountData(loggedUserObj,this ,this.getAllTenantsData)
       
    }

    getAllTenantsData(user, context) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANTS_WITH_USERS_API;
        //  var urlToGetTenantData = Config.API_URL+ '/tenant?action=getAllTenantsWithUsers';
        var urlToGetUserAllAccount = Config.API_URL + AppConstants.GET_ALL_USER_EXAMPLE_ACCOUNT;

        if (user.isSuperUser) {
            urlToGetTenantData = Config.API_URL + AppConstants.GET_ALL_USERS_WITH_TENANTS_API;
        }
        context.setState({
            isLoading: true, 
            loadingMessage: MessageConstants.FETCHING_TENANTS
        });
     
        tenantApi.getALLAccountData(urlToGetUserAllAccount)
        .then((response) => {
            console.log('ACCOUNT');
            console.log(response.accountData);  
           //  console.log(response.accountData[0].name);
            context.setState (
                {
                    isLoading: false,
                    loadingMessage: '',
                    tenantList: response.accountData
                }
            );
               // console.log(this.tenantList)
        });
    }

    updateTenantClick(e, tenantToUpdate, index) {
      
    }

    removeTenantClick(e, tenantToRemove) {
     
    }

    redirectToAddUser() {
     
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse}); 
    }

    tenantDropDown(stateObject) {
        
    }

    modalNoClick() {
      
    }

    modalYesClick() {
       
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isLeftNavCollapse,
            tenantList,
            isModalVisible,
            modalText,
            data
        } = this.state;

        const TenantList =  () => {
            return (
                <table className="table table-striped table-dark" id="tenant-list">
                    <thead>
                        <tr>
                            <th>Account Name</th>
                            <th>Account Email</th>
                            <th>Company</th>
                            <th>Location</th>
                            {
                                (loggedUserObj.isSuperUser)
                                    ? <th></th>
                                    : null
                            }
                        </tr>
                    </thead>
                    <tbody>
                    {
                            tenantList.map((tenant, i) => {
                                return (
                                    <tr className="table-row" key={'userDetail' + i}>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label>
                                                    {
                                                      (tenant.name==='') ? AppConstants.NOT_AVAILABLE_TENANT_NAME
                                                      :tenant.name
                                                    }
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label>
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
                                                <label>
                                                {tenant.company}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="form-group has-feedback">
                                                <label>
                                                   
                                                    {
                                                        (tenant.location === '')
                                                            ? AppConstants.NOT_AVAILABLE_LOCATION
                                                            : tenant.location
                                                    }
                                                </label>
                                            </div>
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
                <ModalContainer
                    title={modalText}
                    yesClick={this.modalYesClick}
                    noClick={this.modalNoClick}
                    isModalVisible={isModalVisible}
                    modalType={AppConstants.CONFIRMATION_MODAL}/>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav
                    selectedIndex={AppConstants.TENANTS_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                    isSubSectionExpand={true}
                    subSectionIndex={AppConstants.MANAGEMENT_INDEX}/>
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

                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default AllAccountView;