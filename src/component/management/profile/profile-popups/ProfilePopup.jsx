import React from 'react';
import axios from 'axios';

import ErrorMessageComponent from '../../../common/error-message-component/ErrorMessageComponent';
import ErrorIconComponent from '../../../common/error-icon-component/ErrorIconComponent';
import LocationSearchInput from '../location-search-input/LocationSearchInput';

import * as MessageConstants from '../../../../constants/MessageConstants';
import * as Config from '../../../../config/config';
import * as AppConstants from '../../../../constants/AppConstants';
import * as UIHelper from '../../../../common/UIHelper';

class ProfilePopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          value: null,
          password        : {value:'', error: {}},
          confirmPassword : {value:'', error: {}},
          selectedFile: null
        };
        this.updatePassword = this.updatePassword.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.renderPicture = this.renderPicture.bind(this);
    }

    passwordCheck(passwordText, confirmPasswordText) {
        var error;

        if (passwordText !== confirmPasswordText) {
            error = {
                hasError: true,
                name: MessageConstants.PASSWORD_CONFIRM_MATCH_ERROR
            };
            this.handleChange({
                password: {value: passwordText, error},
                confirmPassword: {value: confirmPasswordText, error}
            });
        } else {
            error = {
                hasError: UIHelper.isPasswordHasError(passwordText),
                name: MessageConstants.INVALID_PASSWORD_ERROR
            };
            this.handleChange({
                password: {value: passwordText, error},
                confirmPassword: {value: confirmPasswordText, error}
            });
        }

    }

    handleChange(stateObj) {
        this.setState(stateObj);
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    onChangeValue() {
        this.props.update(this.state.value);
    }
    changeLocation(e) {
        this.setState({value: e});
    }

    updatePassword() {
        const {password, confirmPassword} = this.state;
        if (password.error.hasError != true && confirmPassword.error.hasError != true ) {
            this.setState({
                value: password.value,
            }, function () {
              this.onChangeValue();
            });

        }
    }

    renderSelection() {
        return (
          <select
                className="form-control form-control-sm form-group"
                onChange={(e) => this.dropDownClick({value: e.target.value})}>
                {   AppConstants.TIMEZONE_LIST.map((zone) => {
                        return (
                            <option value={zone}>
                                {zone}
                            </option>
                        );
                    })
                 }
            </select>
        )
    }

    renderPicture() {
        return(
            <input type="file" onChange={(e) => {this.fileChangeHandler(e)}}/>
        )
    }
    fileChangeHandler(event) {
        this.setState({ selectedFile: event.target.files[0] })
    }

    uploadHandler() {
        const data = new FormData()
        data.append('file', this.state.selectedFile)
        axios.post(Config.API_URL + AppConstants.UPLOAD_PICTURE, data, {
        })
        .then(res => { // then print response status
          this.props.updatePic(this.state.selectedFile.name);
        })
    }

    renderTextInput() {
      const {password, confirmPassword} = this.state;
      if (this.props.selectedPopup.toLowerCase() == 'password') {
          return (
            <div>
                <div className={
                        'form-group has-feedback ' +
                        ((password.error.hasError !== undefined)
                            ? ((password.error.hasError) ? 'has-error' : 'has-success') : '')
                        }>
                    <input
                        type="password"
                        className="form-control"
                        id="passwordInput"
                        value={password.value}
                        onChange={(e) => {
                            this.passwordCheck(e.target.value, confirmPassword.value);
                        }}
                        placeholder="NEW PASSWORD "/>
                    <ErrorIconComponent error={password.error}/>
                    <ErrorMessageComponent error={password.error}/>
                </div>

                <div className={
                        'form-group has-feedback ' +
                        ((confirmPassword.error.hasError !== undefined)
                            ? ((confirmPassword.error.hasError) ? 'has-error' : 'has-success') : '')
                        }>
                    <input
                        type="password"
                        className="form-control"
                        id="passwordConfirmInput"
                        value={confirmPassword.value}
                        onChange={(e) => {
                            this.passwordCheck(password.value, e.target.value);
                        }}
                        placeholder="CONFIRM PASSWORD"/>
                    <ErrorIconComponent error={confirmPassword.error}/>
                </div>
            </div>

          )
      } else if (this.props.selectedPopup == 'location') {
        return (
          <LocationSearchInput changeLocation={this.changeLocation.bind(this)}/>
        )
      } else {
        return (
          <input
                  className="name change-profile-input form-control"
                  onChange={(e) => {
                      this.handleChange({
                          value: e.target.value
                      });
                  }}
                  id="changeForm"
                  type="text"
                  required />
        )
      }
    }
    render() {
        return (
            <div>
                <div onClick={this.props.closePopup} className="exitOverlay">

                </div>
                <div className="change-profile-form">
                    <div className="change-profile-form-header">
                        <h3 for="changeForm" class="change-profile-title">Change {this.props.selectedPopup}</h3>
                        <i onClick={this.props.closePopup} className="fas fa-times exit"></i>
                    </div>
                    <div className="form-group change-profile-form-group">
                        <label className="change-profile-form-label" for="changeForm">{this.props.selectedPopup} </label>
                        {   (this.props.selectedPopup == 'picture')
                                ? this.renderPicture()
                                : (this.props.selectedPopup.toLowerCase() == 'timezone')
                                      ? this.renderSelection()
                                      : this.renderTextInput()
                        }


                    </div>
                    <div className="change-profile-form-buttons">
                        <button
                            className="formBtnDone formBtn"
                            onClick={
                              (this.props.selectedPopup == 'picture')
                                  ? this.uploadHandler()
                                  : (this.props.selectedPopup == 'password')
                                      ? this.updatePassword.bind(this)
                                      :this.onChangeValue.bind(this)}>
                            SUBMIT
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ProfilePopup;
