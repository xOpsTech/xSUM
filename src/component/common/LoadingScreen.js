import React from 'react';
import PropTypes from 'prop-types';

class LoadingScreen extends React.Component {
    render() {
        const {isDisplay, message} = this.props;
        return (
            (isDisplay)
                ? <div className="loader row">
                      <div className="loadingAnim">
                          <span className="glyphicon glyphicon-refresh spin-refresh-icon"></span>
                          <p>{message}</p>
                      </div>
                  </div>
                : null
        );
    }
}

LoadingScreen.propTypes = {
    isDisplay: PropTypes.bool,
    message: PropTypes.string
};

export default LoadingScreen;
