import React from 'react';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazy-load';
import ResultViewContainer from '../result-view-container/ResultViewContainer';
import {Tab, Tabs} from 'react-bootstrap';

/* eslint-disable no-unused-vars */
import Styles from './ScriptTestResultStyles.less';
/* eslint-enable no-unused-vars */

class ScriptTestResult extends React.Component {
    constructor(props) {
        super(props);

        this.handleSelect = this.handleSelect.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            activeTab: 0,
        };

        return initialState;
    }

    handleSelect(key, e) {

        if (e) {
            this.setState({activeTab: key});
        }

    }

    render() {
        const {jobWithResult, key} = this.props;
        const {activeTab} = this.state;
        const GraphView = (props) => {
            const {key, jobWithResult} = props;
            return (
                <div>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'responseTime'}
                            chartTitle={'Response Time'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'pageDownLoadTime'}
                            chartTitle={'Page Download Time'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'serverResponseTime'}
                            chartTitle={'Server Response Times'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'backEndTime'}
                            chartTitle={'Backend Times'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                </div>
            );
        };
        return (
            <Tabs defaultActiveKey={activeTab}
                activeKey={activeTab} onSelect={(key, e) => this.handleSelect(key, e)} id="script-results-tabs">
                <Tab eventKey={0} title={'Graph View'}>
                    <GraphView key={key} jobWithResult={jobWithResult}/>
                </Tab>
            </Tabs>
        );
    }
}

ScriptTestResult.propTypes = {
    jobWithResult: PropTypes.object,
    key: PropTypes.number
};

export default ScriptTestResult;
