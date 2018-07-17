import React, {Fragment} from 'react';

import ErrorMessageComponent from '../common/error-message-component/ErrorMessageComponent';
import LoginContainer from '../common/login-container/LoginContainer';

/* eslint-disable no-unused-vars */
import Styles from './SiteAddStyles.less';
/* eslint-enable no-unused-vars */

class SiteAdd extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.addClick     = this.addClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            siteValue: '',
            browser  : '',
            error    : {},
            siteList : []
        };

        return initialState;
    }

    handleChange(stateObj) {
        this.setState(stateObj);
    }

    addClick(e) {
        e.preventDefault();

        var {siteValue, browser} = this.state;
        this.state.siteList.push({siteValue, browser});

        this.setState({siteValue: '', browser: ''});
    }

    render() {
        const {error, siteList} = this.state;

        return (
            <Fragment>
                <LoginContainer/>
                <div className="root-container">
                    <div className="logo-div">
                        <img className="logo-img" src="./assets/img/logo.png"/>
                    </div>
                    <form
                        name="site-add-form"
                        method="post">
                        <div className="form-group">
                            <input
                                value={this.state.siteValue}
                                onChange={(e) => this.handleChange({siteValue: e.target.value})}
                                type="text"
                                className="form-control"
                                id="siteValueInput"
                                placeholder="Site Name"/>
                        </div>
                        <div className="form-group">
                            <input
                                value={this.state.browser}
                                onChange={(e) => this.handleChange({browser: e.target.value})}
                                type="text"
                                className="form-control"
                                id="browserValue"
                                placeholder="Browser"/>
                        </div>
                        <ErrorMessageComponent error={error}/>
                        {
                            (siteList.length > 0)
                                ? <div className="container site-list">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Browser</th>
                                                <th>Site Name</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                siteList.map(site => {
                                                    return (
                                                        <tr>
                                                            <td className="table-cell">{site.browser}</td>
                                                            <td className="table-cell">{site.siteValue}</td>
                                                            <td>
                                                                <button
                                                                    className="btn-danger form-control"
                                                                    onClick={(e) => this.loginClick(e)}>
                                                                    X
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                  </div>
                                : null
                        }
                        <div className="form-group">
                            <button
                                className="btn btn-primary form-control"
                                onClick={(e) => this.addClick(e)}>
                                Add a job
                            </button>
                        </div>
                    </form>
                </div>
            </Fragment>
        );
    }
}

SiteAdd.propTypes = {
};

export default SiteAdd;
