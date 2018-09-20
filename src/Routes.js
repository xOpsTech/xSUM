import React from 'react';
import {Route, IndexRoute} from 'react-router';

import Page from './component/Page';
import Login from './component/login/Login';
import SiteAdd from './component/site-add/SiteAdd';
import SiteLoad from './component/site-load/SiteLoad';
import ResultView from './component/result-view/ResultView';
import ResultChartView from './component/result-chart-view/ResultChartView';
import AllResultView from './component/all-result-view/AllResultView';

export default (
    <Route path={'/'} component={Page}>
        <IndexRoute component={SiteLoad}/>
        <Route path="siteadd" component={SiteAdd}/>
        <Route path="siteload" component={SiteLoad}/>
        <Route path="resultView" component={ResultView}/>
        <Route path="resultChartView" component={ResultChartView}/>
        <Route path="allResultView" component={AllResultView}/>
    </Route>
);
