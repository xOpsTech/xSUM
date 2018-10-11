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
    }

    render() {
        const {height, width, locationMarker} = this.props;
        var dataProvider = AppConstants.MAP_CONTENT_DATA;

        if (locationMarker.length > 0) dataProvider.images = locationMarker;

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
            dataProvider: dataProvider
        };

        return (
            <AmCharts.React style={{width, height}} options={mapConfig}/>
        );
    }
}

MapContainer.propTypes = {
    height: PropTypes.string,
    width: PropTypes.string,
    locationMarker: PropTypes.object.array
};

export default MapContainer;
