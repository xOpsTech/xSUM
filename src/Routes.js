import React from 'react';
import {Route, IndexRoute} from 'react-router';

import * as AppConstants from './constants/AppConstants';
import Page from './component/Page';
import Login from './component/login/Login';
import SignUp from './component/sign-up/SignUp';
import SiteAdd from './component/site-add/SiteAdd';
import SiteLoad from './component/site-load/SiteLoad';
import ResultView from './component/result-view/ResultView';
import ResultChartView from './component/result-chart-view/ResultChartView';
import AllResultView from './component/all-result-view/AllResultView';
import AlertView from './component/alert-view/AlertView';
import Tests from './component/tests/Tests';
import AlertListView from './component/alert-list-view/AlertListView';
import UserManagementView from './component/management/user-management/UserManagementView';
import GrantAccessView from './component/management/grant-access/GrantAccessView';
import TenantsView from './component/management/tenants/TenantsView';
import SettingsView from './component/management/settings/SettingsView';
import AddUserView from './component/management/add-user/AddUserView';

export default (
    <Route path={'/'} component={Page}>
        <IndexRoute component={Login}/>
        <Route path={AppConstants.LOGIN_ROUTE} component={Login}/>
        <Route path={AppConstants.SIGN_UP_ROUTE} component={SignUp}/>
        <Route path={AppConstants.SITEADD_ROUTE} component={SiteAdd}/>
        <Route path={AppConstants.SITELOAD_ROUTE} component={SiteLoad}/>
        <Route path={AppConstants.SITE_RESULT_ROUTE} component={ResultView}/>
        <Route path={AppConstants.SITE_CHART_RESULT_ROUTE} component={ResultChartView}/>
        <Route path={AppConstants.ALL_RESULT_VIEW_ROUTE} component={AllResultView}/>
        <Route path={AppConstants.TESTS_ROUTE} component={Tests}/>
        <Route path={AppConstants.ALERT_VIEW_ROUTE} component={AlertView}/>
        <Route path={AppConstants.ALERT_LIST_VIEW_ROUTE} component={AlertListView}/>
        <Route path={AppConstants.USER_MANAGMENT_ROUTE} component={UserManagementView}/>
        <Route path={AppConstants.GRANT_ACCESS_ROUTE} component={GrantAccessView}/>
        <Route path={AppConstants.TENANTS_ROUTE} component={TenantsView}/>
        <Route path={AppConstants.SETTINGS_ROUTE} component={SettingsView}/>
        <Route path={AppConstants.ADD_USER_ROUTE} component={AddUserView}/>
    </Route>
);
