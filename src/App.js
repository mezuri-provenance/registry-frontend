import injectTapEventPlugin from 'react-tap-event-plugin';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

import React, {Component} from 'react';
import {BrowserRouter as Router, Link, Route} from 'react-router-dom';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';

import muiTheme from './MuiTheme';
import './App.css';


const registryBaseUrl = 'http://127.0.0.1:5000';
const getComponentUrlFragmentByComponentType = componentType => name => `${componentType}/${name}`;
const getComponentVersionsUrlFragmentByComponentType = componentType =>
    name => `${getComponentUrlFragmentByComponentType(componentType)(name)}/versions`;
const getComponentVersionUrlFragmentByComponentType = componentType =>
    (name, version) => `${getComponentVersionsUrlFragmentByComponentType(componentType)(name)}/${version}`;

const fetchJson = url => fetch(url).then(res => res.json());


class MezuriRegistryLoader extends Component {
  state = {
    data: null
  };

  _fetch(urlFragment) {
    fetchJson(`${registryBaseUrl}/${urlFragment}`).then(data => this.setState({data}));
  }

  componentDidMount() {
    const {urlFragment} = this.props;
    this._fetch(urlFragment);
  }

  componentWillReceiveProps({urlFragment}) {
    if (urlFragment !== this.props.urlFragment) {
      this._fetch(urlFragment);
    }
  }

  render() {
    const {children, dataKey, hideLoading, _loaded, urlFragment, ...rest} = this.props;
    const loaded = _loaded === undefined ? true : _loaded;
    const {data} = this.state;

    return (
        <div>
          {((data && loaded) || hideLoading) ? React.cloneElement(React.Children.only(children), {
            [dataKey]: data ? data[dataKey] : undefined,
            _loaded: !!data && loaded,
            ...rest
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


function MezuriInterfaceVersion({componentVersion}) {
  return (
      <div>
        {componentVersion.specs.description}
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
              <div className="component">
                <div className="component-header">
                  {match.params.componentName}
                </div>
                <div className="component-version-list-pane">
                  <MezuriRegistryLoader
                      urlFragment={getVersionsUrlFragment(match.params.componentName)}
                      dataKey="versions"
                  >
                    <MezuriVersions
                        componentName={match.params.componentName}
                        getVersionUrlFragment={getVersionUrlFragment}
                    />
                  </MezuriRegistryLoader>
                </div>

                <div className="component-version-pane">
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
        <MuiThemeProvider muiTheme={muiTheme}>
          <div className="app">
            <AppBar
                title="Mezuri Registry"
                style={{textTransform: 'uppercase'}}
                showMenuIconButton={false}
            />
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
                      );
                    case 'interfaces':
                      return (
                          <MezuriComponentHarness
                              getVersionsUrlFragment={getComponentVersionsUrlFragmentByComponentType(componentType)}
                              getVersionUrlFragment={getComponentVersionUrlFragmentByComponentType(componentType)}
                          >
                            <MezuriInterfaceVersion />
                          </MezuriComponentHarness>
                      );
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
        </MuiThemeProvider>
      </Router>
  )
}


export default App;
