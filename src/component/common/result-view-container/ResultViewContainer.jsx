import React from 'react';
import PropTypes from 'prop-types';
import AmCharts from '@amcharts/amcharts3-react';

class ResultViewContainer extends React.Component {
    render() {
        const {jobWithResult, fieldToDisplay, barChartBarClick, chartTitle, keyID} = this.props;
        const barChartConfig = {
            color: '#fff',
            type: 'serial',
            theme: 'light',
            dataProvider: jobWithResult.barChartData,
            valueAxes: [
                {
                    gridColor: '#FFFFFF',
                    gridAlpha: 0.2,
                    dashLength: 0,
                    title: 'time in seconds',
                    autoRotateAngle: 90
                }
            ],
            gridAboveGraphs: true,
            startDuration: 1,
            mouseWheelZoomEnabled: true,
            graphs: [
                {
                    balloonText: '[[category]]: <b>[[value]] seconds</b>',
                    fillAlphas: 0.8,
                    lineAlpha: 0.2,
                    type: 'column',
                    valueField: fieldToDisplay,
                    fillColorsField: 'color'
                }
            ],
            chartScrollbar: {
                graph: 'g1',
                oppositeAxis: false,
                offset: 30,
                scrollbarHeight: 5,
                backgroundAlpha: 0,
                selectedBackgroundAlpha: 0.1,
                selectedBackgroundColor: '#888888',
                graphFillAlpha: 0,
                graphLineAlpha: 0.5,
                selectedGraphFillAlpha: 0,
                selectedGraphLineAlpha: 1,
                autoGridCount: false,
                color: '#AAAAAA'
            },
            chartCursor: {
                limitToGraph:'g1',
                fullWidth: true,
                categoryBalloonEnabled: false,
                cursorAlpha: 0,
                zoomable: true,
                valueZoomable: true
            },
            categoryField: 'execution',
            categoryAxis: {
                gridPosition: 'start',
                gridAlpha: 0,
                tickPosition: 'start',
                tickLength: 20,
                autoRotateAngle: 45,
                autoRotateCount: 5
            },
            maxSelectedTime: 3,
            export: {
                enabled: true
            },
            listeners: [
                {
                    event: 'clickGraphItem',
                    method: function(e) {
                        barChartBarClick(e.item.index);
                    }
                }
            ]
        };

        var lastTestAvg = jobWithResult.barChartData[jobWithResult.barChartData.length-1]
                                && jobWithResult.barChartData[jobWithResult.barChartData.length-1][fieldToDisplay];

        const pieChartConfig = {
            type: 'pie',
            theme: 'light',
            outlineAlpha: 0.7,
            outlineColor: '#343242',
            labelsEnabled: false,
            dataProvider: [
                {
                    title: 'Average Response Time',
                    value: 3
                },
                {
                    title: 'Last Test Average',
                    value: lastTestAvg
                }
            ],
            colors: [
                '#222029', jobWithResult.job.pieChartColor
            ],
            titleField: 'title',
            valueField: 'value',
            labelRadius: 5,
            radius: '42%',
            innerRadius: '70%',
            labelText: '[[title]]',
            export: {
                enabled: true
            }
        };

        return (
            <div className="row single-chart">
                <div className="row">
                    <div className="col-sm-4"></div>
                    <div className="col-sm-3">
                        <h4 className="job-name-div">
                            Job Name : {jobWithResult.job.jobName}
                        </h4>
                    </div>
                    <div className="col-sm-5">
                        <h4 className="job-name-div">
                        {chartTitle}
                        </h4>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-4">
                        <div className="row">
                            <AmCharts.React style={{width: '100%', height: '270px'}} options={pieChartConfig}/>
                        </div>
                        {/* <div className="row pie-chart-heading">
                            Last Test Average
                        </div> */}
                    </div>
                    <div className="col-sm-8">
                        <AmCharts.React style={{width: '100%', height: '300px'}} options={barChartConfig}/>
                    </div>
                </div>
            </div>
        );

    }
}

ResultViewContainer.propTypes = {
    jobWithResult: PropTypes.object,
    fieldToDisplay: PropTypes.string,
    barChartBarClick: PropTypes.func,
    chartTitle: PropTypes.string,
    keyID: PropTypes.number
};

export default ResultViewContainer;
