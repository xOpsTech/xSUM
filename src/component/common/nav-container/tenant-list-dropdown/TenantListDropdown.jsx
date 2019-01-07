import React from 'react';
import PropTypes from 'prop-types';

import tenantApi from '../../../../api/tenantApi';

import * as AppConstants from '../../../../constants/AppConstants';
import * as Config from '../../../../config/config';
import * as MessageConstants from '../../../../constants/MessageConstants';
import * as UIHelper from '../../../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './TenantListStyles.less';
/* eslint-enable no-unused-vars */

class TenantListDropdown extends React.Component {
    constructor(props) {
        super(props);

        this.dropDownClick = this.dropDownClick.bind(this);
        this.getAllTenantsWithUsers = this.getAllTenantsWithUsers.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            selectedTenantIndex: 0,
            selectedTenant: {},
            tenantList: []
        };

        return initialState;
    }

    componentWillReceiveProps(nextProps) {
        (nextProps.loggedUserObj && this.state.tenantList.length === 0)
            && this.getAllTenantsWithUsers(nextProps.loggedUserObj, this);
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

    dropDownClick(stateObject) {
        this.props.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        this.setState(stateObject);
    }

    render() {
        const {loggedUserObj, tenantDropDown} = this.props;
        const {selectedTenant, selectedTenantIndex, tenantList} = this.state;

        return (
            <div className="row">
                <div className="col-sm-4 col-lg-3 alert-label-column">
                    <div className="form-group label-text">
                        <label className="control-label">Account </label>
                    </div>
                </div>
                <div className="col-sm-8 col-lg-9">
                    <div className="form-group">
                        <select className="form-control form-group"
                            value={selectedTenantIndex}
                            onChange={(e) => {
                                let stateObj = {
                                    selectedTenant: tenantList[e.target.value],
                                    selectedTenantIndex: e.target.value
                                };
                                tenantDropDown && tenantDropDown(stateObj, e.target.value);
                                this.dropDownClick(stateObj);
                            }}>
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
        );
    }
}

TenantListDropdown.propTypes = {
    loggedUserObj: PropTypes.object
};

export default TenantListDropdown;
