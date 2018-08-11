import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import {Modal, Button} from 'react-bootstrap';
import * as AppConstants from '../../../constants/AppConstants';

/* eslint-disable no-unused-vars */
import Styles from './ModalStyles.less';
/* eslint-enable no-unused-vars */

class ModalContainer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {modalType, title, isModalVisible} = this.props;
        if (modalType === AppConstants.CONFIRMATION_MODAL) {
            const {yesClick, noClick} = this.props;
            return (
                <Modal show={isModalVisible}>
                    <Modal.Body>
                        <h4>{title}</h4>
                        <div className="confirm-button-container">
                            <Button className="btn btn-primary yes-button"
                                onClick={yesClick}>
                                Yes
                            </Button>
                            <Button className="btn btn-danger no-button"
                                onClick={noClick}>
                                No
                            </Button>
                        </div>
                    </Modal.Body>
                </Modal>
            );
        } else if (modalType === AppConstants.DATA_MODAL) {
            const {dataObject, closeClick, viewResult} = this.props;

            if (dataObject !== null) {
                return (
                    <Modal show={isModalVisible}>
                        <Modal.Header>
                            <h4 className="data-modal-header">{title + dataObject.siteObject.value}</h4>
                            <button type="button" className="close"
                                onClick={closeClick} aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </Modal.Header>
                        <Modal.Body className="result-list-body">
                            <table className="table table-bordered" id="data-modal-table">
                                <thead>
                                    <tr>
                                        <th>Executed Date</th>
                                        <th>View Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        dataObject.result.map((result, i) => {
                                            return (
                                                <tr className="table-row" key={'siteDetail' + i}>
                                                    <td className="table-cell">
                                                        {moment(result.executedDate).format(AppConstants.DATE_FORMAT)}
                                                    </td>
                                                    <td className="table-cell">
                                                        <button
                                                            className="btn-primary form-control"
                                                            onClick={
                                                                (e) => viewResult(e,
                                                                    result.resultUrl)
                                                            }>
                                                            Result
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                        </Modal.Body>
                    </Modal>
                );
            } else {
                return null;
            }

        }

    }
}

ModalContainer.propTypes = {
    modalType: PropTypes.string.isRequired,
    isModalVisible: PropTypes.bool,
    title: PropTypes.string.isRequired,
    yesClick: PropTypes.func,
    noClick: PropTypes.func,
    closeClick: PropTypes.func
};

export default ModalContainer;
