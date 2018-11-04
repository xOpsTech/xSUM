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
        this.collapseButtonClick = this.collapseButtonClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isNavCollapse: false
        };

        return initialState;
    }

    componentWillMount() {
        this.setState({isNavCollapse: UIHelper.getLeftState()});
    }

    tabOnClick(e, selectedTab) {
        e.preventDefault();

        if (this.props.selectedIndex !== selectedTab.index) {
            UIHelper.redirectTo(selectedTab.route, {});
        }

    }

    collapseButtonClick(e) {
        e.preventDefault();

        var {isNavCollapse} = this.state;
        UIHelper.setLocalStorageValue(AppConstants.LEFTNAV_COLLAPSE_STATE, !isNavCollapse);
        this.setState({isNavCollapse: !isNavCollapse});
        this.props.leftNavStateUpdate && this.props.leftNavStateUpdate();
    }

    render() {
        const {selectedIndex, isFixedLeftNav} = this.props;
        const {isNavCollapse} = this.state;

        if (!isNavCollapse) {
            return (
                <div id="leftNavContainer" role="navigation" aria-label="left"
                    className={(isFixedLeftNav) ? 'fixed-top-nav-bar' : ''}>
                    <button className="collapse-button collapse-nav-button" onClick={this.collapseButtonClick}>
                        <span className="glyphicon glyphicon-triangle-left collapse-icon">
                        </span>
                    </button>
                    <Nav id="leftNav"
                        activeKey={selectedIndex}
                        onSelect={this.handleNavSelect}>
                        {
                            AppConstants.LEFT_NAV_TABS.map((tab, i) => {
                                return (
                                    <NavItem
                                        eventKey={tab.index}
                                        href="#"
                                        key={i}
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
        } else {
            return (
                <div className={(isFixedLeftNav) ? 'collapse-left-nav ' : ''}>
                    <button className="collapse-button" onClick={this.collapseButtonClick}>
                        <span className="glyphicon glyphicon-triangle-right collapse-icon">
                        </span>
                    </button>
                    <div className="left-nav-indicator">
                    </div>
                </div>
            );
        }


    }
}

LeftNav.defaultProps = {
    selectedIndex: 0,
    isFixedLeftNav: true
};

LeftNav.propTypes = {
};

export default LeftNav;
