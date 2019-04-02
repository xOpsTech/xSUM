import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazy-load';
import LoadingScreen from '../../loading-screen/LoadingScreen';

import jobApi from '../../../../api/jobApi';

import * as Config from '../../../../config/config';
import * as AppConstants from '../../../../constants/AppConstants';
import * as MessageConstants from '../../../../constants/MessageConstants';
import * as UIHelper from '../../../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './SummaryViewStyles.less';
/* eslint-enable no-unused-vars */

class SummaryView extends React.Component {
    constructor(props) {
        super(props);

        this.getSummaryViewData = this.getSummaryViewData.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            summaryResults: null
        };

        return initialState;
    }

    componentWillMount() {
        let {selectedTenant, job} = this.props;
        this.getSummaryViewData(selectedTenant, job);
    }

    getSummaryViewData(selectedTenant, job) {
        var url = Config.API_URL + AppConstants.GET_SUMMARY_RESULTS_API;
        this.setState({isLoading: true, loadingMessage: MessageConstants.LOAD_SUMMARY_VIEW_DATA});
        jobApi.getResult(url, {tenantID: selectedTenant._id, jobId: job.jobId}).then((data) => {
            this.setState({summaryResults: data.summaryResults, isLoading: false, loadingMessage: ''});
        });
    }

    render() {
        const {isLoading, loadingMessage, summaryResults} = this.state;
        const {selectedTenant, job} = this.props;
        const ResultTile = (props) => {
            return (
                <div className="col-sm-3">
                    <div className={'tile-container ' + props.styleClass}>
                        {props.tileName}
                        <div className="tile-value">
                            {props.tileValue}
                        </div>
                    </div>
                </div>
            );
        };
        const SummaryResultTiles = (props) => {
            if (props.summaryResult.tableName === 'score') {
                return (
                    props.summaryResult.result.map((resultObj, j) => {
                        let tileName = undefined;
                        switch (resultObj.advice) {
                            case null:
                                tileName = 'Overall Score';
                                break;
                            case 'performance':
                                tileName = 'Performance Score';
                                break;
                            case 'bestpractice':
                                tileName = 'Best Practice score';
                                break;
                            case 'accessibility':
                                tileName = 'Accessibility score';
                                break;

                        }
                        let styleClass = 'error';
                        if (resultObj.value > 90) {
                            styleClass = 'ok';
                        } else if (resultObj.value > 80) {
                            styleClass = 'warning';
                        }

                        if (tileName !== undefined) {
                            return <ResultTile tileName={tileName} tileValue={resultObj.value} styleClass={styleClass}/>;
                        } else {
                            return null;
                        }

                    })
                );
            } else {
                let valueToDisplay = (props.summaryResult.result.length > 0)
                                         ? UIHelper.roundValueToTwoDecimals(props.summaryResult.result[0].mean/1000) + ' s'
                                         : 'N/A';
                return <ResultTile
                            tileName={props.summaryResult.displayName}
                            tileValue={valueToDisplay}
                            styleClass={'info'}/>;
            }

        };
        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                {
                    summaryResults && summaryResults.map((summaryResult, i) => {
                        return <SummaryResultTiles summaryResult={summaryResult}/>;
                    })
                }
            </Fragment>
        );
    }
}

SummaryView.propTypes = {
    job: PropTypes.object,
    selectedTenant: PropTypes.object
};

export default SummaryView;
