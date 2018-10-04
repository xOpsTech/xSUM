import React from 'react';
import PropTypes from 'prop-types';

class ErrorIconComponent extends React.Component {
    render() {
        const {error} = this.props;

        if (error.hasError !== undefined) {
            return (
                <span
                    className={'glyphicon form-control-feedback ' +
                        ((error.hasError) ? 'glyphicon-remove' : 'glyphicon-ok')}>
                </span>
            );
        } else {
            return null;
        }

    }
};

ErrorIconComponent.propTypes = {
    error: PropTypes.object
};

export default ErrorIconComponent;
