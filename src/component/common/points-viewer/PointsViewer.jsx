import React, {Fragment} from 'react';
import AmCharts from '@amcharts/amcharts3-react';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './PointsViewerStyles.less';
/* eslint-enable no-unused-vars */

class PointsViewer extends React.Component {
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
        const {selectedTenant} = this.props;

        const pieChartConfig = {
            type: 'pie',
            theme: 'dark',
            outlineAlpha: 0.7,
            outlineColor: '#343242',
            labelsEnabled: false,
            dataProvider: [
                {
                    title: 'Points Used',
                    value: (selectedTenant.points)
                                ? (selectedTenant.points.totalPoints - selectedTenant.points.pointsRemain)
                                : 0
                },
                {
                    title: 'Points Remain',
                    value: (selectedTenant.points) ? selectedTenant.points.pointsRemain : 0
                }
            ],
            legend: {
                enabled: true,
                align: 'center',
                markerType: 'square'
            },
            colors: [
                '#222029', '#eb00ff'
            ],
            titleField: 'title',
            valueField: 'value',
            labelRadius: 10,
            radius: '30%',
            innerRadius: '60%',
            labelText: '[[title]]',
            export: {
                enabled: true
            }
        };

        return (
            <div className="row">
                <div className="row">
                    <div className="col-sm-4"></div>
                    <div className="col-sm-4 alert-label-column section-head">
                        <h4 className="site-add-title">
                            Points View
                        </h4>
                    </div>
                    <div className="col-sm-4"></div>
                </div>
                <AmCharts.React style={{width: '100%', height: '270px'}} options={pieChartConfig}/>
            </div>
        );
    }
}

PointsViewer.propTypes = {
};

export default PointsViewer;
