import PropTypes from 'prop-types';
import React from 'react';

class Page extends React.Component {
    render() {
        return (
            <div role="main" id="content">
                {this.props.children}
            </div>
        );
    }
}

Page.propTypes = {
    children: PropTypes.object.isRequired
};

export default Page;
