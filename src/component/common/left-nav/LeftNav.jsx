import React, {Fragment} from 'react';
import {Nav, NavItem, Panel} from 'react-bootstrap';

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
        this.showHideSubSection = this.showHideSubSection.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isNavCollapse: false,
            isSubSectionExpand: false,
            loggedUserObj: null
        };

        return initialState;
    }

    componentWillMount() {
        this.setState({isNavCollapse: UIHelper.getLeftState()});
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            UIHelper.getUserData(loggedUserObject, this);
        }

        if (this.props.isSubSectionExpand) {
            this.setState({isSubSectionExpand: this.props.isSubSectionExpand});
        }
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

    showHideSubSection(e) {
        e.preventDefault();

        this.setState({isSubSectionExpand: !this.state.isSubSectionExpand});
    }

    render() {
        const {selectedIndex, isFixedLeftNav} = this.props;
        const {isNavCollapse, isSubSectionExpand, loggedUserObj} = this.state;

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

                                if (tab.subSections) {

                                    if ((tab.index === -1
                                        && loggedUserObj
                                        && loggedUserObj.permissions
                                        && loggedUserObj.permissions.canCreate
                                        && loggedUserObj.permissions.canUpdate) || (tab.index !== -1)) {
                                            return (
                                                <Fragment>
                                                    <button className="tab-with-sub-section"
                                                        onClick={this.showHideSubSection}>
                                                        {tab.text}
                                                        <span className={
                                                                'glyphicon ' +
                                                                ((isSubSectionExpand)
                                                                    ? 'glyphicon-chevron-down '
                                                                    : 'glyphicon-chevron-right ') + 'button-icon span-icon'}>
                                                        </span>
                                                    </button>
                                                    <Panel expanded={isSubSectionExpand} className="sub-section-panel">
                                                        <Panel.Collapse>
                                                            <Panel.Body>
                                                                <Nav id={'subNav-' + tab.index}
                                                                    activeKey={selectedIndex}
                                                                    onSelect={this.handleNavSelect}
                                                                    className="sub-nav">
                                                                {
                                                                    tab.subSections.map((subTag, j) => {
                                                                        return (
                                                                            <NavItem
                                                                                eventKey={subTag.index}
                                                                                href="#"
                                                                                key={j}
                                                                                id={subTag.index}
                                                                                onClick={(e) => {
                                                                                    this.tabOnClick(e, subTag);
                                                                                }}>
                                                                                {subTag.text}
                                                                            </NavItem>
                                                                        );
                                                                    })
                                                                }
                                                                </Nav>
                                                            </Panel.Body>
                                                        </Panel.Collapse>
                                                    </Panel>
                                                </Fragment>
                                            );
                                    } else {
                                        return null;
                                    }

                                } else {
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
                                }

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
