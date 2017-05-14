import React, {Component} from 'react';
import {BrowserRouter as Router, Link, Route} from 'react-router-dom';

import logo from './logo.svg';
import './App.css';


const registryBaseUrl = 'http://127.0.0.1:5000';
const getComponentUrlFragmentByComponentType = componentType => name => `${componentType}/${name}`;
const getComponentVersionsUrlFragmentByComponentType = componentType =>
    name => `${getComponentUrlFragmentByComponentType(componentType)(name)}/versions`;
const getComponentVersionUrlFragmentByComponentType = componentType =>
    (name, version) => `${getComponentVersionsUrlFragmentByComponentType(componentType)(name)}/${version}`;

const fetchJson = url => fetch(url).then(res => res.json());


class ComponentDisplay extends Component {
  state = {
    component: null
  };

  componentDidMount() {
    const {match} = this.props;

    fetch(getComponentUrlFragmentByComponentType()())
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


class MezuriRegistryLoader extends Component {
  state = {
    data: null
  };

  componentDidMount() {
    const {urlFragment} = this.props;
    fetchJson(`${registryBaseUrl}/${urlFragment}`).then(data => this.setState({data}))
  }

  render() {
    const {children, dataKey} = this.props;
    const {data} = this.state;

    return (
        <div>
          {data ? React.cloneElement(React.Children.only(children), {
            [dataKey]: data[dataKey]
          }) : (<div>Loading...</div>)}
        </div>
    )
  }
}


function MezuriSourceVersion({componentVersion}) {
  return (
    <div>
      Name: {componentVersion.componentName}
      <br/>
      Version: {componentVersion.version}
    </div>
  );
}


function MezuriVersions({componentName, versions, getVersionUrlFragment}) {
  return (
      <ul>
        {versions.map(versionInfo => (
            <li key={versionInfo.version}>
              <Link to={`/${getVersionUrlFragment(componentName, versionInfo.version)}`}>
                {versionInfo.version}
              </Link>
            </li>
        ))}
      </ul>
  )
}


function MezuriComponentHarness({getVersionsUrlFragment, getVersionUrlFragment, children}) {
  return (
      <Route
          path={`/${getVersionsUrlFragment(':componentName')}`}
          render={({match}) => (
              <div>
                <div style={{float: 'left'}}>
                  <MezuriRegistryLoader
                      urlFragment={getVersionsUrlFragment(match.params.componentName)}
                      dataKey="versions"
                  >
                    <MezuriVersions
                        componentName={match.params.sourceName}
                        getVersionUrlFragment={getVersionUrlFragment}
                    />
                  </MezuriRegistryLoader>
                </div>

                <div style={{float: 'left'}}>
                  <Route
                      path={`/${getVersionUrlFragment(':componentName', ':componentVersion')}`}
                      render={({match}) => (
                          <MezuriRegistryLoader
                              urlFragment={getVersionUrlFragment(
                                  match.params.componentName,
                                  match.params.componentVersion
                              )}
                              dataKey='componentVersion'
                          >
                            {children}
                          </MezuriRegistryLoader>
                      )}
                  />
                </div>
              </div>
          )}
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
              path={`/:componentType`}
              render={({match}) => {
                const {componentType} = match.params;
                switch(componentType) {
                  case 'sources':
                    return (
                        <MezuriComponentHarness
                            getVersionsUrlFragment={getComponentVersionsUrlFragmentByComponentType(componentType)}
                            getVersionUrlFragment={getComponentVersionUrlFragmentByComponentType(componentType)}
                        >
                          <MezuriSourceVersion />
                        </MezuriComponentHarness>
                    )
                  default:
                    return (
                        <div>
                          Invalid route
                        </div>
                    )
                }

              }}
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
    fetch(getComponentUrlFragmentByComponentType())
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
