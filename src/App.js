import React from 'react';
import {Router, useRouterHistory} from 'react-router';

import createHashHistory from 'history/lib/createHashHistory';
import routes from './Routes';

/* eslint-disable no-unused-vars */
import Styles from './Styles.less';
/* eslint-enable no-unused-vars */

class App extends React.Component {
    render() {
        const customHistory = useRouterHistory(createHashHistory)();

        return (
            <div>
                <Router history={customHistory} routes={routes}/> 
            </div>
        );
    }
}

export default App;
