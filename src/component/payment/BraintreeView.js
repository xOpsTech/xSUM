import React, { Fragment } from 'react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import LeftNav from '../common/left-nav/LeftNav';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

import DropIn from 'braintree-web-drop-in-react';
import paymentApi from '../../api/paymentApi';

/* eslint-disable no-unused-vars */
import Styles from './BraintreePayment.less';
/* eslint-enable no-unused-vars */

class BraintreeView extends React.Component {
    instance;

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = this.getInitialState();
    }

    componentDidMount() {
        var paymentAuthUrl =
            Config.API_URL + AppConstants.GET_CLIENT_TOKEN_DATA_API;

        paymentApi.getClientToken(paymentAuthUrl).then(data => {
            console.log(3333, data);
            this.setState({
                clientToken: data.clientToken
            });
        });
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(
            AppConstants.SITE_LOGIN_COOKIE
        );

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({ loggedUserObj: loggedUserObject });
            UIHelper.getUserData(
                loggedUserObject,
                this,
                this.getAllTenantsData
            );
        } else {
            UIHelper.redirectLogin();
        }

        this.setState({ isLeftNavCollapse: UIHelper.getLeftState() });
    }

    async buy() {
        // Send the nonce to your server
        console.log(123456, this.state.loggedUserObj);
        const { nonce } = await this.instance.requestPaymentMethod();
        //await fetch(`server.test/purchase/${nonce}`);
        var paymentNonceUrl = Config.API_URL + AppConstants.NONCE_DATA_API;

        var checkoutObj = {
            tenantId: this.state.selectedTenant._id,
            userId: this.state.loggedUserObj._id,
            amount: this.state.amount,
            nonce: nonce
        };

        paymentApi.checkoutPayment(paymentNonceUrl, checkoutObj).then(data => {
            console.log(3333, data);
        });
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            siteList: [],
            loggedUserObj: null,
            isLeftNavCollapse: false,
            selectedTenant: { userList: [] },
            clientToken: null,
            amount: 0
        };

        return initialState;
    }

    getAllTenantsData(user, context) {
        UIHelper.getAllTenantsData(user, context, context.getAllJobs);
    }

    getAllJobs(loggedUserObj, selectedTenant, context) {
        var url = Config.API_URL + AppConstants.JOBS_GET_API;
        context.setState({
            isLoading: true,
            loadingMessage: MessageConstants.FETCHING_JOBS
        });
        var objectToRetrieve = {
            tenantID: selectedTenant._id
        };
        jobApi.getAllJobsFrom(url, objectToRetrieve).then(data => {
            context.setState({
                siteList: data,
                isLoading: false,
                loadingMessage: ''
            });
        });
    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({ isLeftNavCollapse: !this.state.isLeftNavCollapse });
    }

    tenantDropDown(stateObject) {
        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(
                AppConstants.SELECTED_TENANT_ID,
                stateObject.selectedTenant._id
            );
        this.setState(stateObject);

        this.getAllJobs(
            this.state.loggedUserObj,
            stateObject.selectedTenant,
            this
        );
    }

    handleChange(event) {
        this.setState({ amount: event.target.value });
    }

    render() {
        console.log(23, this.state.loggedUserObj);

        const {
            isLoading,
            loadingMessage,
            siteList,
            loggedUserObj,
            isLeftNavCollapse
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage} />
                <LeftNav
                    selectedIndex={AppConstants.TESTS_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                />

                {loggedUserObj ? (
                    <NavContainer
                        loggedUserObj={loggedUserObj}
                        isFixedNav={true}
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
                            <div className="row" />
                            <div className="row">
                                <div className="col-sm-5 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">
                                            Company
                                        </label>
                                    </div>
                                </div>
                                <div className="col-sm-7">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="responseTimeoutInput"
                                            disabled
                                            value={
                                                this.state.loggedUserObj.company
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-5 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">
                                            Name
                                        </label>
                                    </div>
                                </div>
                                <div className="col-sm-7">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="responseTimeoutInput"
                                            disabled
                                            value={
                                                this.state.loggedUserObj.name
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-5 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">
                                            Email
                                        </label>
                                    </div>
                                </div>
                                <div className="col-sm-7">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="responseTimeoutInput"
                                            disabled
                                            value={
                                                this.state.loggedUserObj.email
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-5 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">
                                            Amount
                                        </label>
                                    </div>
                                </div>
                                <div className="col-sm-7">
                                    <div className="form-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="responseTimeoutInput"
                                            value={this.state.amouont}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        {!this.state.clientToken && (
                                            <div>
                                                <h1>Loading...</h1>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-7" />
                                <div className="col-sm-7">
                                    <div className="form-group">
                                        {this.state.clientToken && (
                                            <div>
                                                <div>
                                                    <DropIn
                                                        options={{
                                                            authorization: this
                                                                .state
                                                                .clientToken
                                                        }}
                                                        onInstance={instance =>
                                                            (this.instance = instance)
                                                        }
                                                    />
                                                    <button
                                                        onClick={this.buy.bind(
                                                            this
                                                        )}
                                                    >
                                                        Buy
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

BraintreeView.propTypes = {};

export default BraintreeView;
