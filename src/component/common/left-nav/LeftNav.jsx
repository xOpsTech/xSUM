import React from 'react';
import {Nav, NavItem} from 'react-bootstrap';

import * as AppConstants from '../../../constants/AppConstants';
import * as UIHelper from '../../../common/UIHelper';
/* eslint-disable no-unused-vars */
import Styles from './LeftNavStyles.less';
/* eslint-enable no-unused-vars */

class LeftNav extends React.Component {
    constructor(props) {
        super(props);

        this.tabOnClick = this.tabOnClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            activeIndex: 0
        };

        return initialState;
    }

    componentWillReceiveProps(nextProps) {
        this.setState({activeIndex: nextProps.selectedIndex});
    }

    tabOnClick(e, selectedTab) {
        e.preventDefault();
        this.setState({activeIndex: selectedTab.index});

        if (this.props.selectedIndex !== selectedTab.index) {
            UIHelper.redirectTo(selectedTab.route, {});
        }

    }

    render() {
        const {activeIndex} = this.state;

        return (
            <div id="leftNavContainer" role="navigation" aria-label="left">
                <Nav id="leftNav"
                    activeKey={activeIndex}
                    onSelect={this.handleNavSelect}>
                    {
                        AppConstants.LEFT_NAV_TABS.map((tab, i) => {
                            return (
                                <NavItem
                                    eventKey={tab.index}
                                    href="#"
                                    id={tab.index}
                                    onClick={(e) => {
                                        this.tabOnClick(e, tab);
                                    }}>
                                    {tab.text}
                                </NavItem>
                            );
                        })
                    }
                </Nav>
            </div>
        );
    }
}

LeftNav.propTypes = {
};

export default LeftNav;
