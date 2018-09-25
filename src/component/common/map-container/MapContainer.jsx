import React from 'react';
import PropTypes from 'prop-types';
import AmCharts from '@amcharts/amcharts3-react';

import * as AppConstants from '../../../constants/AppConstants';

/* eslint-disable no-unused-vars */
import Styles from './MapContainerStyles.less';
/* eslint-enable no-unused-vars */

class MapContainer extends React.Component {
    constructor(props) {
        super(props);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {};
        return initialState;
    }

    render() {
        const {height, width} = this.props;
        const mapConfig = {
            type: 'map',
            theme: 'dark',
            projection: 'winkel3',
            areasSettings: {
                autoZoom: true,
                rollOverOutlineColor: '#9a7bca',
                selectedColor: '#9a7bca',
                color: '#a791b4',
                rollOverColor: '#9a7bca'
            },
            dataProvider: AppConstants.MAP_CONTENT_DATA
        };

        return (
            <AmCharts.React style={{width, height}} options={mapConfig}/>
        );
    }
}

MapContainer.propTypes = {
    height: PropTypes.string,
    width: PropTypes.string
};

export default MapContainer;
