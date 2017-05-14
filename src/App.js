import React, {Component} from 'react';
import {BrowserRouter as Router, Link, Route} from 'react-router-dom';

import logo from './logo.svg';
import './App.css';


const registryBaseUrl = 'http://127.0.0.1:5000';
const sourcesUrlFragment = 'sources';
const getSourceUrlFragment = name => `${sourcesUrlFragment}/${name}`;
const getSourceVersionsUrlFragment = name => `${getSourceUrlFragment(name)}/versions`;
const getSourceVersionUrlFragment = (name, version) => `${getSourceVersionsUrlFragment(name)}/${version}`;

const fetchJson = url => fetch(url).then(res => res.json());


class ComponentDisplay extends Component {
  state = {
    component: null
  };

  componentDidMount() {
    const {match} = this.props;

    fetch(getSourceUrlFragment(match.params.componentName))
        .then(res => res.json())
        .then(data => this.setState({component: data.sourceVersion}));
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


class MezuriSourceVersion extends Component {
  state = {
    sourceVersion: null
  };

  componentDidMount() {
    const {sourceName, sourceVersion} = this.props.match.params;
    fetchJson(`${registryBaseUrl}/${getSourceVersionUrlFragment(sourceName, sourceVersion)}`)
        .then(data => {this.setState({
          sourceVersion: data.componentVersion
        })
    })
  }

  render() {
    const {sourceVersion} = this.state;

    return (
        <div>
          {sourceVersion ? (
              <div>
                Name: {sourceVersion.componentName}
                <br/>
                Version: {sourceVersion.version}
              </div>
          ) : (
              <div>
                Loading...
              </div>
          )}
        </div>
    )
  }
}


class MezuriSourceVersions extends Component {
  state = {
    sourceVersions: null,
    sourceName: null
  };

  componentDidMount() {
    const {sourceName} = this.props.match.params;
    fetchJson(`${registryBaseUrl}/${getSourceVersionsUrlFragment(sourceName)}`)
        .then(data => this.setState({
          sourceVersions: data.versions,
          sourceName: sourceName
        }));
  }

  render() {
    const {sourceName, sourceVersions} = this.state;
    return (
        <div>
          <div style={{float: 'left'}}>
            {sourceVersions ? (
                <ul>
                  {sourceVersions.map(versionInfo => (
                      <li key={versionInfo.version}>
                        <Link to={`/${getSourceVersionUrlFragment(sourceName, versionInfo.version)}`}>
                          {versionInfo.version}
                        </Link>
                      </li>
                  ))}
                </ul>
            ) : (
                <div>
                  Loading...
                </div>
            )}
          </div>

          <div style={{float: 'left'}}>
            <Route
                path={`/${getSourceVersionUrlFragment(':sourceName', ':sourceVersion')}`}
                component={MezuriSourceVersion}
            />
          </div>
        </div>
    )
  }

}


function MezuriSource() {
  return (
      <Route
          path={`/${getSourceVersionsUrlFragment(':sourceName')}`}
          component={MezuriSourceVersions}
      />
  )
}


function App() {
  return (
      <Router>
        <div className="App">
          <div className="App-header">
            <h2>Mezuri Registry</h2>
          </div>
          <Route
              path={`/${getSourceUrlFragment(':sourceName')}`}
              component={MezuriSource}
          />
        </div>
      </Router>
  )
}


class AppOld extends Component {
  state = {
    sources: null,
  };

  componentDidMount() {
    fetch(sourcesUrlFragment)
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
