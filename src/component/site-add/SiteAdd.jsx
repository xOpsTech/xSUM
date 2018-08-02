import React, {Fragment} from 'react';
import DateTimePicker from 'react-datetime-picker';
import moment from 'moment';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LoginContainer from '../common/login-container/LoginContainer';
import NavContainer from '../common/nav-container/NavContainer';

import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './SiteAddStyles.less';
/* eslint-enable no-unused-vars */

class SiteAdd extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.addClick     = this.addClick.bind(this);
        this.onChangeDateTime = this.onChangeDateTime.bind(this);
        this.redirectToSiteLoad = this.redirectToSiteLoad.bind(this);
        this.recursiveCheckBoxClick = this.recursiveCheckBoxClick.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = "Site Add - xSum";
    }

    componentWillMount() {

        if (this.props.location.query.userObj) {
            var loggedUserObject = JSON.parse(this.props.location.query.userObj);
            this.setState({loggedUserObj: loggedUserObject});
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            siteObject: {value:'', error: {}},
            browser  : AppConstants.BROWSER_ARRAY[0].value,
            error    : {},
            siteList : [],
            scheduleDate: new Date(),
            loggedUserObj: null,
            isRecursiveCheck: false,
            recursiveSelect: AppConstants.RECURSIVE_EXECUTION_ARRAY[0].value
        };

        return initialState;
    }

    onChangeDateTime(scheduleDate) {
        this.setState({ scheduleDate });
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    addClick(e) {
        e.preventDefault();

        var {siteObject, browser, scheduleDate, isRecursiveCheck, recursiveSelect} = this.state;
        siteObject.value = 'http://' + siteObject.value;
        this.state.siteList.push({
            siteObject,
            browser,
            scheduleDate: moment(scheduleDate).format(AppConstants.DATE_FORMAT),
            isRecursiveCheck,
            recursiveSelect
        });

        this.setState({
            siteObject: {value:'', error: {}}
        });
    }

    redirectToSiteLoad() {
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    recursiveCheckBoxClick(e) {
        this.setState({isRecursiveCheck: !this.state.isRecursiveCheck});
    }

    render() {
        const {
            error,
            siteList,
            scheduleDate,
            siteObject,
            browser,
            loggedUserObj,
            isRecursiveCheck,
            recursiveSelect
        } = this.state;

        return (
            <Fragment>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              siteLoad={this.redirectToSiteLoad}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div className="root-container">
                    <div className="logo-div">
                        <img className="logo-img" src="./assets/img/logo.png"/>
                    </div>
                    <form
                        name="site-add-form"
                        method="post">
                        <div className="form-group">
                            <div className={
                                    'input-group has-feedback ' +
                                    ((siteObject.error.hasError !== undefined)
                                        ? ((siteObject.error.hasError) ? 'has-error' : 'has-success') : '')
                                }>
                                <span className="input-group-addon">
                                    http://
                                </span>
                                <input
                                    value={siteObject.value}
                                    onChange={(e) => this.handleChange(e, {
                                        siteObject: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isUrlHasError(e.target.value),
                                                name: MessageConstants.URL_ERROR
                                            }
                                        }
                                    })}
                                    type="text"
                                    className="form-control"
                                    id="urlObjectInput"
                                    placeholder="URL"/>
                            </div>
                        </div>
                        <div className="form-group">
                            <select
                                  className="form-control form-control-sm form-group"
                                  value={browser}
                                  onChange={(e) => this.dropDownClick({browser: e.target.value})}>
                                  {
                                      AppConstants.BROWSER_ARRAY.map(browser => {
                                          return <option value={browser.value}>{browser.textValue}</option>
                                      })
                                  }
                              </select>
                        </div>
                        <div className="form-group form-row">
                            <DateTimePicker
                                className="col-sm-6 my-1 datepicker-for-scheduler"
                                onChange={(scheduleDate) => this.onChangeDateTime(scheduleDate)}
                                value={scheduleDate}/>
                                <div className="col-auto my-1">
                                    <div className="form-check">
                                        <input className="form-check-input recursive-checkbox"
                                            type="checkbox"
                                            id="recursiveCheck"
                                            value={isRecursiveCheck}
                                            onChange={this.recursiveCheckBoxClick}/>
                                        <label className="form-check-label" for="recursiveCheck">
                                            Recursive Execution
                                        </label>
                                    </div>
                                </div>
                        </div>
                        {
                            (isRecursiveCheck)
                                ? <select
                                      className="form-control form-control-sm form-group"
                                      value={recursiveSelect}
                                      onChange={(e) => this.dropDownClick({recursiveSelect: e.target.value})}>
                                      {
                                          AppConstants.RECURSIVE_EXECUTION_ARRAY.map(execution => {
                                              return <option value={execution.value}>{execution.textValue}</option>
                                          })
                                      }
                                  </select>
                                : null
                        }
                        <ErrorMessageComponent error={error}/>
                        {
                            (siteList.length > 0)
                                ? <div className="container site-list">
                                    <h4>Job List</h4>
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Site URL</th>
                                                <th>Browser</th>
                                                <th>Schedule Date</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                siteList.map(site => {
                                                    return (
                                                        <tr>
                                                            <td className="table-cell">{site.siteObject.value}</td>
                                                            <td className="table-cell">{site.browser}</td>
                                                            <td className="table-cell">
                                                                {site.scheduleDate}
                                                                {
                                                                    (site.isRecursiveCheck)
                                                                        ? <div>({site.recursiveSelect})</div>
                                                                        : null
                                                                }
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn-danger form-control"
                                                                    onClick={(e) => this.loginClick(e)}>
                                                                    X
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                  </div>
                                : null
                        }
                        <div className="form-group">
                            <button
                                className="btn btn-primary form-control"
                                onClick={(e) => this.addClick(e)}>
                                Add a job
                            </button>
                        </div>
                    </form>
                </div>
            </Fragment>
        );
    }
}

SiteAdd.propTypes = {
};

export default SiteAdd;
