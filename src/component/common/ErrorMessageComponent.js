import React from 'react';
import PropTypes from 'prop-types';

class ErrorMessageComponent extends React.Component {
    render() {
        const {error} = this.props;
        return (
            (error.hasError)
                ? <div className="alert-danger">
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
