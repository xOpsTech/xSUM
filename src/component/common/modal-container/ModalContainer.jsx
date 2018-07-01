import PropTypes from 'prop-types';
import React from 'react';
import {Modal, Button} from 'react-bootstrap';

/* eslint-disable no-unused-vars */
import Styles from './ModalStyles.less';
/* eslint-enable no-unused-vars */

class ModalContainer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal show={this.props.isModalVisible}>
                <Modal.Body>
                    <h4>{this.props.title}</h4>
                    <div className="confirm-button-container">
                        <Button className="btn btn-primary yes-button"
                            onClick={this.props.yesClick}>
                            Yes
                        </Button>
                        <Button className="btn btn-danger no-button"
                            onClick={this.props.noClick}>
                            No
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

ModalContainer.propTypes = {
    isModalVisible: PropTypes.bool,
    title: PropTypes.string.isRequired,
    yesClick: PropTypes.func,
    noClick: PropTypes.func
};

export default ModalContainer;
