import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import NavContainer from '../../common/nav-container/NavContainer';
import ErrorIconComponent from '../../common/error-icon-component/ErrorIconComponent';
import ErrorMessageComponent from '../../common/error-message-component/ErrorMessageComponent';
import jobApi from '../../../api/jobApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './SendOneTimeJobEmailsStyles.less';
/* eslint-enable no-unused-vars */

class SendOneTimeJobEmails extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.sendEmail = this.sendEmail.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            emailAddress: {value: this.props.jobWithResult.job.userEmail, error: {}}
        };

        return initialState;
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    sendEmail(e) {
        e.preventDefault();

        const {emailAddress} = this.state;
        const {selectedTenant, jobWithResult} = this.props;

        var isEmailValid = (emailAddress.error.hasError === undefined || !emailAddress.error.hasError);

        if (isEmailValid) {
            var url = Config.API_URL + AppConstants.SEND_ONE_TIME_JOB_EMAIL_API;
            this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
            var objectToRetrieve = {
                tenantID: selectedTenant._id,
                email: emailAddress.value,
                job: jobWithResult.job,
                timezone: moment.tz.guess()
            };
            jobApi.updateJob(url, objectToRetrieve).then((data) => {
                this.setState({isLoading: false, loadingMessage: ''});
            });
        }

    }

    render() {
        const {
            isLoading,
            loadingMessage,
            emailAddress
        } = this.state;

        const {loggedUserObj} = this.props;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <div>
                    <div className="col-sm-12 add-top-margin">
                        <div className={
                            'form-group has-feedback ' +
                            ((emailAddress.error.hasError !== undefined)
                                ? ((emailAddress.error.hasError) ? 'has-error' : 'has-success') : '')
                            }>
                            <input
                                value={emailAddress.value}
                                onChange={(e) => {
                                    this.handleChange(e, {
                                        emailAddress: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isEmailHasError(e.target.value),
                                                name: MessageConstants.EMAIL_ERROR
                                            }
                                        }
                                    });
                                }}
                                type="email"
                                className="form-control"
                                id="emailInput"
                                placeholder="EMAIL"/>
                            <ErrorIconComponent error={emailAddress.error}/>
                            <ErrorMessageComponent error={emailAddress.error}/>
                        </div>
                    </div>

                    <div className="row alert-list-wrap-div">
                        {
                            (loggedUserObj.permissions && loggedUserObj.permissions.canUpdate)
                                ? <div className="row">
                                    <div className="col-sm-12 alert-label-column">
                                        <div className="form-group">
                                            <button
                                                className="btn btn-primary form-control button-all-caps-text"
                                                onClick={(e) => this.sendEmail(e)}>
                                                Send Email
                                            </button>
                                        </div>
                                    </div>
                                 </div>
                                : null
                        }
                    </div>
                </div>
            </Fragment>
        );
    }
}

SendOneTimeJobEmails.propTypes = {
    jobWithResult: PropTypes.object,
    selectedTenant: PropTypes.object,
    loggedUserObj: PropTypes.object
};

export default SendOneTimeJobEmails;
