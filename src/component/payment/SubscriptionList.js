import React, { Fragment } from 'react';

import LeftNav from '../common/left-nav/LeftNav';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';

import userApi from '../../api/userApi';
import paymentApi from '../../api/paymentApi';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
//import Styles from './AllResultViewStyles.less';
/* eslint-enable no-unused-vars */

class SubscriptionList extends React.Component {
    constructor(props) {
        super(props);

        this.getSubscriptionsByTenantId = this.getSubscriptionsByTenantId.bind(
            this
        );
        // Setting initial state objects
        this.state = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Results View - ' + AppConstants.PRODUCT_NAME;
        document.getElementById('background-video').style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(
            AppConstants.SITE_LOGIN_COOKIE
        );
        var loggedUserObject = JSON.parse(siteLoginCookie);
        console.log(1, loggedUserObject);
        var urlToGetUserData = Config.API_URL + AppConstants.GET_USER_DATA_API;

        this.setState({
            isLoading: true,
            loadingMessage: MessageConstants.FETCHING_USER
        });

        if (siteLoginCookie) {
            userApi
                .getUser(urlToGetUserData, { email: loggedUserObject.email })
                .then(data => {
                    console.log(77, data);
                    var x = data.user;

                    this.setState({
                        isLoading: false,
                        loadingMessage: '',
                        loggedUserObj: x,
                        selectedTenantId: data.user.tenants[0].tenantID
                    });
                    console.log(2);
                    this.getSubscriptionsByTenantId(
                        data.user.tenants[0].tenantID
                    );
                });
        } else {
            UIHelper.redirectLogin();
        }

        this.setState({ isLeftNavCollapse: UIHelper.getLeftState() });
    }

    getSubscriptionsByTenantId(tenantId) {
        var paymentUrl = Config.API_URL + AppConstants.SUBSCRIPTION_ROUTE;
        paymentApi
            .getAllSubscriptions(paymentUrl, { tenantId: tenantId })
            .then(data => {
                console.log(8, data);
                this.setState({ subscriptionList: data.subscriptions });
            });
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            subscriptionList: [],
            selectedTenantId: -1
        };

        return initialState;
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            subscriptionList,
            isLeftNavCollapse
        } = this.state;

        console.log(67, subscriptionList);

        const SubList = () => {
            var activeSubCount = 0;
            subscriptionList.map(sub => {
                if (sub._id) {
                    activeSubCount++;
                }
            });

            if (activeSubCount > 0) {
                return (
                    <table
                        className="table table-striped table-dark"
                        id="alert-list"
                    >
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>UserId</th>
                                <th>Amount</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptionList.map((sub, i) => {
                                if (sub._id) {
                                    return (
                                        <tr
                                            className="table-row"
                                            key={'siteDetail' + i}
                                        >
                                            <td className="table-cell">
                                                <div className="form-group has-feedback">
                                                    <label>{sub.updated}</label>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="form-group has-feedback">
                                                    <label>{sub.userId}</label>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="form-group has-feedback">
                                                    <label>{sub.amount}</label>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    return null;
                                }
                            })}
                        </tbody>
                    </table>
                );
            } else {
                return (
                    <div className="empty-list-style">
                        No subscription history available
                    </div>
                );
            }
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage} />
                {loggedUserObj ? (
                    <NavContainer
                        loggedUserObj={loggedUserObj}
                        isFixedNav={true}
                        leftNavStateUpdate={this.leftNavStateUpdate}
                        tenantDropDown={this.tenantDropDown}
                    />
                ) : (
                    <div className="sign-in-button">
                        <button
                            onClick={() => {
                                UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
                            }}
                            className="btn btn-primary btn-sm log-out-drop-down--li--button"
                        >
                            Sign in
                        </button>
                    </div>
                )}
                <LeftNav
                    selectedIndex={AppConstants.ALL_RESULT_VIEW_INDEX}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                    isSubSectionExpand={true}
                    subSectionIndex={AppConstants.DASHBOARDS_INDEX}
                />
                <div className="site-edit-container">
                    <div
                        className={
                            'table-container-div ' +
                            (isLeftNavCollapse
                                ? 'collapse-left-navigation'
                                : 'expand-left-navigation')
                        }
                    >
                        <div className="row alert-list-wrap-div">
                            <SubList />
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

SubscriptionList.propTypes = {};

export default SubscriptionList;
