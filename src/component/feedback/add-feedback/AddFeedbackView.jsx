import React, {Fragment} from 'react';
import ErrorMessageComponent from '../../common/error-message-component/ErrorMessageComponent';
import ErrorIconComponent from '../../common/error-icon-component/ErrorIconComponent';
import LeftNav from '../../common/left-nav/LeftNav';
import NavContainer from '../../common/nav-container/NavContainer';
import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import feedbackApi from '../../../api/feedbackApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './FeedbackViewStyles.less';
/* eslint-enable no-unused-vars */

class AddFeedbackView extends React.Component {
    constructor(props) {
        super(props);

        this.dropDownClick = this.dropDownClick.bind(this);
        this.handleChange  = this.handleChange.bind(this);
        this.tenantDropDown = this.tenantDropDown.bind(this);
        this.saveFeedback = this.saveFeedback.bind(this);
        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Add Feedback - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {

        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject, email: loggedUserObject.email});
            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectLogin();
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            loggedUserObj: null,
            isLoading: false,
            loadingMessage: '',
            name: {value:'', error: {}},
            email: '',
            subject: {value:'', error: {}},
            message: {value:'', error: {}},
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    handleChange(stateObj) {
        this.setState(stateObj);
    }

    tenantDropDown(stateObject) {
        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        this.setState(stateObject);

        this.getAllAlerts(this.state.loggedUserObj, stateObject.selectedTenant, this);
    }
    saveFeedback(e) {
        e.preventDefault();

        const {name, email, subject, message} = this.state;
        var undefinedCheck = !(name.error.hasError === undefined ||
                             subject.error.hasError === undefined);
        var errorCheck = !(name.error.hasError ||
                             subject.error.hasError);
        if (undefinedCheck && errorCheck) {
            var urlToSaveFeedback = Config.API_URL + AppConstants.SAVE_FEEDBACK_API;
            var feedbackData = {
                name: name.value,
                email: email,
                subject: subject.value,
                message: message.value
            };

            feedbackApi.saveFeedback(urlToSaveFeedback, feedbackData).then(() => {
                this.setState(
                    {
                        isLoading: false,
                        loadingMessage: '',
                    }
                );
                UIHelper.redirectTo(AppConstants.ALL_RESULT_VIEW_ROUTE, {});
            });
        } else {
            if(name.error.hasError === undefined) {
                this.setState({
                    name: {
                        value: name.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.EMPTY_ERROR
                        }
                    }
                });
            }

            if(subject.error.hasError === undefined) {
                this.setState({
                    subject: {
                        value: subject.value,
                        error: {
                            hasError: true,
                            name: MessageConstants.EMPTY_ERROR
                        }
                    }
                });
            }
        }



    }
    render() {
        const {
            loggedUserObj,
            isLoading,
            loadingMessage,
            name,
            email,
            subject,
            message
        } = this.state;
        return (
            <Fragment>
            {
                (loggedUserObj)
                    ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              isFixedNav={false}
                              tenantDropDown={this.tenantDropDown}/>
                    : <div className="sign-in-button">
                          <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                              className="btn btn-primary btn-sm log-out-drop-down--li--button">
                              Sign in
                          </button>
                      </div>
            }
            <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
            <LeftNav selectedIndex={AppConstants.ALERT_LIST_VIEW_INDEX} isFixedLeftNav={false}/>
                <div className="feedback-view">
                    <div id="feedback-row" className="row">
                        <div className="col-sm-12">
                            <h1 className="feedback-title">Contact</h1>
                        </div>
                    </div>
                    <form
                        name="feedback-add-form"
                        method="post">
                        <div className="row">
                          <div className="col-sm-12">
                                <div className="form-group">
                                  <label className="control-label">Name</label>
                                  <input
                                      value={name.value}
                                      onChange={(e) => {
                                          this.handleChange({
                                              name: {
                                                  value: e.target.value,
                                                  error: {
                                                      hasError: UIHelper.isEmptyError(e.target.value),
                                                      name: MessageConstants.EMPTY_ERROR
                                                  }
                                              }
                                          });
                                      }}
                                      type="text"
                                      className="form-control"/>
                                </div>
                            </div>
                            <ErrorIconComponent error={name.error}/>
                            <ErrorMessageComponent error={name.error}/>
                        </div>
                        <div className="row">
                          <div className="col-sm-12">
                                <div className="form-group">
                                  <label className="control-label">Email</label>
                                  <input
                                      value={email}
                                      onChange={e => this.setState({ email: e.target.value })}
                                      type="email"
                                      className="form-control"
                                      id="emailInput"/>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                          <div className="col-sm-12">
                                <div className="form-group">
                                  <label className="control-label">Subject</label>
                                  <input
                                      value={subject.value}
                                      onChange={(e) => {
                                          this.handleChange({
                                              subject: {
                                                  value: e.target.value,
                                                  error: {
                                                      hasError: UIHelper.isEmptyError(e.target.value),
                                                      name: MessageConstants.EMPTY_ERROR
                                                  }
                                              }
                                          });
                                      }}
                                      type="text"
                                      className="form-control"/>
                                </div>
                            </div>
                            <ErrorIconComponent error={subject.error}/>
                            <ErrorMessageComponent error={subject.error}/>
                        </div>

                        <div className="row">
                          <div className="col-sm-12">
                                <div className="form-group">
                                  <label className="control-label">Message</label>
                                  <textarea
                                      value={message.value}
                                      onChange={(e) => {
                                          this.handleChange({
                                              message: {
                                                  value: e.target.value,
                                                  error: {
                                                      hasError: UIHelper.isEmptyError(e.target.value),
                                                      name: MessageConstants.EMPTY_ERROR
                                                  }
                                              }
                                          });
                                      }}
                                      name="Text1"
                                      rows="10"
                                      className="form-control"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="form-group feedback-button-div">
                            <button
                                className="btn btn-primary form-control button-all-caps-text feedback-button"
                                onClick={(e) => this.saveFeedback(e)}>
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </Fragment>
        );
    }
}

AddFeedbackView.propTypes = {
};

export default AddFeedbackView;
