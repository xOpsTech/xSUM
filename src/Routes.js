import React from 'react';
import {Route, IndexRoute} from 'react-router';

import Page from './component/Page';
import Login from './component/login/Login';
import SiteAdd from './component/site-add/SiteAdd';
import SiteLoad from './component/site-load/SiteLoad';

export default (
    <Route path={'/'} component={Page}>
        <IndexRoute component={Login}/>
        <Route path="login" component={Login}/>
        <Route path="siteadd" component={SiteAdd}/>
        <Route path="siteload" component={SiteLoad}/>
    </Route>
);
