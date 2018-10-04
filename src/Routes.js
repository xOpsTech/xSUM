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

export default (
    <Route path={'/'} component={Page}>
        <IndexRoute component={SiteLoad}/>
        <Route path={AppConstants.LOGIN_ROUTE} component={Login}/>
        <Route path={AppConstants.SIGN_UP_ROUTE} component={SignUp}/>
        <Route path={AppConstants.SITEADD_ROUTE} component={SiteAdd}/>
        <Route path={AppConstants.SITELOAD_ROUTE} component={SiteLoad}/>
        <Route path={AppConstants.SITE_RESULT_ROUTE} component={ResultView}/>
        <Route path={AppConstants.SITE_CHART_RESULT_ROUTE} component={ResultChartView}/>
        <Route path={AppConstants.ALL_RESULT_VIEW_ROUTE} component={AllResultView}/>
    </Route>
);
