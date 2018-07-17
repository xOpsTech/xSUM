import React from 'react';
import PropTypes from 'prop-types';

/* eslint-disable no-unused-vars */
import Styles from './ErrorMessageStyles.less';
/* eslint-enable no-unused-vars */

class ErrorMessageComponent extends React.Component {
    render() {
        const {error} = this.props;
        return (
            (error.hasError)
                ? <div className="alert-danger error-message-component">
                      {error.name}
                  </div>
                : null
        );
    }
}

ErrorMessageComponent.propTypes = {
    error: PropTypes.object
};

export default ErrorMessageComponent;
