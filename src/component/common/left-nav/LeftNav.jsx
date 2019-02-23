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
        var colSubSecStateArray = [];

        // Create collapse state for every subsection in left navigation
        AppConstants.LEFT_NAV_TABS.map((tab, i) => {

            if (tab.subSections) {
                colSubSecStateArray.push({
                    subSectionIndex: tab.subSectionIndex,
                    isSubSectionExpand: false
                });
            }

        });

        var initialState = {
            isNavCollapse: false,
            loggedUserObj: null,
            colSubSecStateArray: colSubSecStateArray
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

        if (this.props.isSubSectionExpand && this.props.subSectionIndex !== undefined) {
            var {colSubSecStateArray} = this.state;
            colSubSecStateArray[this.props.subSectionIndex].isSubSectionExpand = this.props.isSubSectionExpand;
            this.setState({colSubSecStateArray: colSubSecStateArray});
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

    showHideSubSection(e, tab) {
        e.preventDefault();
        var {colSubSecStateArray} = this.state;
        colSubSecStateArray[tab.subSectionIndex].isSubSectionExpand
                                                        = !colSubSecStateArray[tab.subSectionIndex].isSubSectionExpand;
        this.setState({colSubSecStateArray: colSubSecStateArray});
    }

    render() {
        const {selectedIndex, isFixedLeftNav} = this.props;
        const {isNavCollapse, loggedUserObj, colSubSecStateArray} = this.state;

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
                                    var isSubSectionExpand = colSubSecStateArray[tab.subSectionIndex].isSubSectionExpand;
                                    if ((tab.index === -1
                                        && loggedUserObj
                                        && loggedUserObj.permissions
                                        && loggedUserObj.permissions.canCreate
                                        && loggedUserObj.permissions.canUpdate) || (tab.index !== -1)) {
                                            return (
                                                <Fragment>
                                                    <button className="tab-with-sub-section"
                                                        onClick={(e) => this.showHideSubSection(e, tab)}>
                                                        {tab.text}
                                                        <span className={
                                                                'glyphicon ' +
                                                                ((isSubSectionExpand)
                                                                    ? 'glyphicon-chevron-down '
                                                                    : 'glyphicon-chevron-right ')
                                                                        + 'button-icon span-icon'}>
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

                                                                        if ((loggedUserObj
                                                                            && loggedUserObj.isSuperUser
                                                                            && subTag.index
                                                                                === AppConstants.BILLING_INDEX)
                                                                            || subTag.index
                                                                                !== AppConstants.BILLING_INDEX) {
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
                                                                        } else {
                                                                            return null;
                                                                        }

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
