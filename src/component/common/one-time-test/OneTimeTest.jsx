import React, {Fragment} from 'react';

import * as AppConstants from '../../../constants/AppConstants';
import * as MessageConstants from '../../../constants/MessageConstants';
import * as UIHelper from '../../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './OneTimeTestStyles.less';
/* eslint-enable no-unused-vars */

class OneTimeTest extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {urlObject} = this.props;
        return (
            <Fragment>
                <h3 className="search-text">
                    Run a one-time test
                </h3>
                <form name="site-add-form">
                    <div className={
                            'input-group has-feedback '
                            // ((urlObject.error.hasError !== undefined)
                            //     ? ((urlObject.error.hasError) ? 'has-error' : 'has-success') : '')
                        }>
                        {
                            // <span className="input-group-addon">
                            //     http://
                            // </span>

                            //     onChange={(e) => this.handleChange(e, {
                            //     urlObject: {
                            //         value: e.target.value,
                            //         error: {
                            //             hasError: UIHelper.isUrlHasError(e.target.value),
                            //             name: MessageConstants.URL_ERROR
                            //         }
                            //     }
                            // })}
                            /*onKeyPress={this.searchKeyPress}*/

                            //{/*onClick={this.searchClick}>*/}
                        }
                        <input
                            value={urlObject.value}
                            type="text"
                            disabled={/*(isLoading)? 'disabled' :*/ ''}
                            className="form-control"
                            id="urlObjectInput"
                            placeholder="ENTER WEBSITE URL"/>
                        <span className="input-group-addon">
                            <i className="glyphicon glyphicon-search"></i>
                        </span>
                    </div>
                </form>
            </Fragment>
        );
    }
}

OneTimeTest.propTypes = {
};

export default OneTimeTest;
