import injectTapEventPlugin from 'react-tap-event-plugin';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

import React, {Component} from 'react';
import {BrowserRouter as Router, Link, Route, matchPath} from 'react-router-dom';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Paper from 'material-ui/Paper'
import AppBar from 'material-ui/AppBar';
import Chip from 'material-ui/Chip';
import {List, ListItem, makeSelectable} from 'material-ui/List'
const SelectableList = makeSelectable(List);

import muiTheme from './MuiTheme';
import './App.css';


const registryBaseUrl = 'http://127.0.0.1:5000';
const getComponentUrlFragmentByComponentType = componentType => name => `${componentType}/${name}`;
const getComponentVersionsUrlFragmentByComponentType = componentType =>
    name => `${getComponentUrlFragmentByComponentType(componentType)(name)}/versions`;
const getComponentVersionUrlFragmentByComponentType = componentType =>
    (name, version) => `${getComponentVersionsUrlFragmentByComponentType(componentType)(name)}/${version}`;
const getComponentVersionDependentsUrlFragmentByComponentType = componentType =>
    (name, version) => `${getComponentVersionUrlFragmentByComponentType(componentType)(name, version)}/dependents`;

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


function MezuriComponentInfo({componentInfo}) {
  const {componentType, componentName, componentVersion} = componentInfo;
  const componentVersionText = `${componentName} v${componentVersion}`;
  return (
      <Chip
          key={componentVersionText}
          containerElement={(
              <Link to={`/${getComponentVersionUrlFragmentByComponentType(componentType)(
                  componentName,
                  componentVersion
              )}`}/>
          )}
      >
        {componentVersionText}
      </Chip>
  );
}


function MezuriDependentsInfo({dependentsInfo}) {
  return (
      <div>
        Dependents: {dependentsInfo.length > 0 ? dependentsInfo.map(
            dependentInfo => <MezuriComponentInfo key={dependentInfo} componentInfo={dependentInfo} />
        ) : (<span>None</span>)}
      </div>
  );
}


function MezuriSourceVersion({componentVersion, getComponentVersionDependentsUrlFragment}) {
  return (
      <div>
        {componentVersion.specs.description}
        <br />
        <br />
        Dependencies: {componentVersion.specs.dependencies.length > 0 ? componentVersion.specs.dependencies.map(
            dependencyInfo => <MezuriComponentInfo key={dependencyInfo} componentInfo={dependencyInfo} />
        ) : <span>None</span>}
        <br/>
        <br/>
        <MezuriRegistryLoader
            urlFragment={getComponentVersionDependentsUrlFragment(
                componentVersion.componentName,
                componentVersion.version
            )}
            dataKey="dependentsInfo"
        >
          <MezuriDependentsInfo />
        </MezuriRegistryLoader>
      </div>
  );
}


const MezuriInterfaceVersion = MezuriSourceVersion;


function MezuriVersions({componentName, versions, getVersionUrlFragment, location}) {
  const currentPath = location.pathname;
  let currentVersionIndex = undefined;
  for (let index = 0; index < versions.length; index++) {
    const match = matchPath(currentPath, {
      path: `/${getVersionUrlFragment(componentName, versions[index].version)}`
    });
    if (match) {
      currentVersionIndex = index;
      break;
    }
  }

  console.log(currentVersionIndex);
  return (
      <SelectableList
          value={currentVersionIndex}
          style={{width: '125px'}}
      >
        {versions.map((versionInfo, index) => (
            <ListItem
                value={index}
                key={versionInfo.version}
                containerElement={(
                    <Link to={`/${getVersionUrlFragment(componentName, versionInfo.version)}`} />
                )}
            >
              {versionInfo.version}
            </ListItem>
        ))}
      </SelectableList>
  )
}


function MezuriComponentHarness({getVersionsUrlFragment, getVersionUrlFragment, children}) {
  return (
      <Route
          path={`/${getVersionsUrlFragment(':componentName')}`}
          render={({match, location}) => (
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
                        location={location}
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
          <Paper className="app" zDepth={3}>
            <AppBar
                title="Mezuri Registry"
                className="app-header"
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
                            <MezuriSourceVersion
                                getComponentVersionDependentsUrlFragment={getComponentVersionDependentsUrlFragmentByComponentType(componentType)}
                            />
                          </MezuriComponentHarness>
                      );
                    case 'interfaces':
                      return (
                          <MezuriComponentHarness
                              getVersionsUrlFragment={getComponentVersionsUrlFragmentByComponentType(componentType)}
                              getVersionUrlFragment={getComponentVersionUrlFragmentByComponentType(componentType)}
                          >
                            <MezuriInterfaceVersion
                                getComponentVersionDependentsUrlFragment={getComponentVersionDependentsUrlFragmentByComponentType(componentType)}
                            />
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
          </Paper>
        </MuiThemeProvider>
      </Router>
  )
}


export default App;
