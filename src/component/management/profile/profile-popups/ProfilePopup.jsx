import React from 'react';

class ProfilePopup extends React.Component {
    render() {
        return (
            <div className="change-profile-form">
                <div className="change-profile-form-header">
                    <h3 for="changeForm" class="change-profile-title">Change {this.props.selectedPopup}</h3>
                    <i onClick={this.props.closePopup} className="fas fa-times exit"></i>
                </div>
                <div className="form-group change-profile-form-group">
                    <label className="change-profile-form-label" for="changeForm">{this.props.selectedPopup} </label>
                    <input className="name change-profile-input form-control" id="changeForm" type="text" required />
                </div>
                <div className="change-profile-form-buttons">
                    <button className="formBtnDone formBtn"> SUBMIT </button>
                </div>
            </div>
        );
    }
}

export default ProfilePopup;