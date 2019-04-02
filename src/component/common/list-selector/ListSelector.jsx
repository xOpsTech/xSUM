import React, {Fragment} from 'react';
import PropTypes from 'prop-types';

/* eslint-disable no-unused-vars */
import Styles from './ListSelectorStyles.less';
/* eslint-enable no-unused-vars */

class ListSelector extends React.Component {
    constructor(props) {
        super(props);

        this.selectDataRow          = this.selectDataRow.bind(this);
        this.listControlButtonClick = this.listControlButtonClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            selectedIndex: undefined
        };

        return initialState;
    }

    selectDataRow(selectedIndex) {
        this.setState({
            selectedIndex: selectedIndex
        });
    }

    listControlButtonClick(isAll, isShow) {
        const {updateDataList} = this.props;
        const {selectedIndex} = this.state;

        updateDataList(isAll, isShow, selectedIndex);
    }

    render() {
        const {dataList, loggedUserObj, isSaveButtonVisible, saveButtonClick} = this.props;
        const {selectedIndex} = this.state;

        const DataRow = (props) => {
            const {object, index} = props;
            return(
                <div
                    className={
                        'row data-row' +
                        ((selectedIndex !== undefined && selectedIndex === index) ? ' data-row-selected' : '')
                    }
                    onClick={() => this.selectDataRow(index)}>
                    {object.jobName}
                </div>
            );
        };

        const ListControlButton = (props) => {
            const {buttonIconClass, clickEvent, isAll, isShow} = props;
            return(
                <div className="row">
                    <button className="list-button" onClick={(e)=>clickEvent(isAll, isShow)}>
                        <i className={'list-button-icon ' + buttonIconClass}></i>
                    </button>
                </div>
            );
        };

        return (
            <Fragment>
                <div className="row list-container">
                    <div className="col-sm-5 list-panel">
                        <div className="row list-title">
                            Visible Jobs
                        </div>
                        {
                            dataList.map((object, i) => {

                                if (object.isShow) {
                                    return (
                                        <DataRow object={object} index={i}/>
                                    );
                                }

                            })
                        }
                    </div>
                    <div className="col-sm-2 button-container">
                        <ListControlButton
                            buttonIconClass='fa fa-angle-right'
                            clickEvent={this.listControlButtonClick}
                            isAll={false}
                            isShow={false}/>
                        <ListControlButton
                            buttonIconClass='fa fa-angle-double-right'
                            clickEvent={this.listControlButtonClick}
                            isAll={true}
                            isShow={false}/>
                        <ListControlButton
                            buttonIconClass='fa fa-angle-left'
                            clickEvent={this.listControlButtonClick}
                            isAll={false}
                            isShow={true}/>
                        <ListControlButton
                            buttonIconClass='fa fa-angle-double-left'
                            clickEvent={this.listControlButtonClick}
                            isAll={true}
                            isShow={true}/>
                    </div>
                    <div className="col-sm-5 list-panel">
                        <div className="row list-title">
                            Hidden Jobs
                        </div>
                        {
                            dataList.map((object, i) => {

                                if (!object.isShow) {
                                    return (
                                        <DataRow object={object} index={i}/>
                                    );
                                }

                            })
                        }
                    </div>
                </div>
                {
                    (isSaveButtonVisible && loggedUserObj.permissions && loggedUserObj.permissions.canUpdate)
                        ? <div className="row save-button-section">
                            <button
                                className="btn btn-primary form-control button-all-caps-text"
                                onClick={(e) => saveButtonClick(e)}>
                                Save Settings
                            </button>
                         </div>
                        : null
                }
            </Fragment>
        );
    }
}

ListSelector.propTypes = {
    dataList: PropTypes.object.array,
    updateDataList: PropTypes.func,
    loggedUserObj: PropTypes.object,
    saveButtonClick: PropTypes.func
};

export default ListSelector;
