import React, {Component} from 'react';
import {BrowserRouter as Router, Link, Route} from 'react-router-dom';

import logo from './logo.svg';
import './App.css';

const sourcesUrl = 'http://127.0.0.1:5000/sources';
const getSourceUrl = componentName => `http://127.0.0.1:5000/sources/${componentName}`;


class ComponentDisplay extends Component {
  state = {
    component: null
  };

  componentDidMount() {
    const {match} = this.props;

    fetch(getSourceUrl(match.params.componentName))
        .then(res => res.json())
        .then(data => this.setState({component: data.component}));
  }

  render() {
    const {component} = this.state;

    return (<div>
      {component
          ? <div>
            Name: {component.name}
          </div>
          : <div>Loading...</div>}
    </div>);
  }
}


const ComponentListItem = ({children}) => (
    <div style={{textAlign: 'left'}}>
      {children}
    </div>
);


class App extends Component {
  state = {
    sources: null,
  };

  componentDidMount() {
    fetch(sourcesUrl)
        .then(res => res.json())
        .then(data => {
          const sources = {};
          data.components.forEach(component => sources[component.name] = component);
          this.setState({sources});
        })
  }

  render() {
    const {sources} = this.state;

    return (
        <Router>
          <div className="App">
            <div className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              <h2>Welcome to React</h2>
            </div>
            <div style={{float: 'left'}}>
              {sources
                  ? (Object.values(sources).map(s => (
                      <ComponentListItem key={s.name}>
                        <Link to={`/${s.name}`}>
                          {s.name}
                        </Link>
                      </ComponentListItem>
                  )))
                  : <div>Loading...</div>
              }
            </div>
            <div style={{float: 'left'}}>
              <h3>Component</h3>
              <Route path="/:componentName" component={ComponentDisplay} />
            </div>
          </div>
        </Router>
    );
  }
}

export default App;
