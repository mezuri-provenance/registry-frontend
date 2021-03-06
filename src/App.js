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
import {Table, TableBody, TableRow, TableRowColumn} from 'material-ui/Table';

import {red400, blue400, grey400} from 'material-ui/styles/colors';
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


function MezuriBaseDeserializedDataType({dataType}) {
  return <div style={{backgroundColor: grey400, padding: '2px', width: '75px'}}>{dataType}</div>
}


function MezuriDeserializedDataType({serialized, style}) {
  const [type, contents] = serialized;
  let actualStyle = Object.assign({}, style || {});

  switch (type) {
    case 'LIST':
      actualStyle = Object.assign(actualStyle, {
        backgroundColor: red400,
      });

      return (
          <table style={actualStyle} className="deserialized">
            <tbody>
            <tr>
              <td className="deserialized-label">STREAM</td>
              <td><MezuriDeserializedDataType serialized={contents} /></td>
            </tr>
            </tbody>
          </table>
      );
    case 'DICT':
      actualStyle = Object.assign(actualStyle, {
        backgroundColor: blue400,
      });

      return (
          <table style={actualStyle} className="deserialized">
            <tbody>
              {Object.keys(contents).map((name, index) => (
                  <tr key={name} className="deserialized-struct-td">
                    {index === 0 &&
                    <td
                        className="deserialized-label"
                        rowSpan={Object.keys(contents).length}
                    >
                      STRUCT
                    </td>}
                    <td className="deserialized-label">{name}</td>
                    <td><MezuriDeserializedDataType serialized={contents[name]} /></td>
                  </tr>
              ))}
            </tbody>
          </table>
      );
    default:
      return <MezuriBaseDeserializedDataType dataType={type} />;
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


function MezuriComponentsInfo({componentsInfo}) {
  if (componentsInfo.length === 0) {
    return <span>None</span>;
  }

  return (
      <span>
        {componentsInfo.map(
            componentInfo => <MezuriComponentInfo key={componentInfo} componentInfo={componentInfo} />
        )}
      </span>
  );
}


function MezuriDependenciesInfo({dependencyInfo}) {
  return (
      <div>
        Dependencies: <MezuriComponentsInfo componentsInfo={dependencyInfo} />
      </div>
  );
}


function MezuriDependentsInfo({dependentsInfo}) {
  return (
    <MezuriComponentsInfo componentsInfo={dependentsInfo} />
  );
}


function MezuriSourceVersion({componentVersion, getComponentVersionDependentsUrlFragment}) {
  const {specs, componentName, version} = componentVersion;

  return (
      <div>
        {specs.description}
        <br /><br />
        <MezuriDependenciesInfo dependencyInfo={specs.dependencies} />
        <br/><br/>
        <MezuriRegistryLoader
            urlFragment={getComponentVersionDependentsUrlFragment(componentName, version)}
            dataKey="dependentsInfo"
        >
          <MezuriDependentsInfo />
        </MezuriRegistryLoader>
      </div>
  );
}


function MezuriInterfaceVersion({componentVersion, getComponentVersionDependentsUrlFragment}) {
  const {specs, componentName, version} = componentVersion;
  const {iopDeclaration} = specs;

  return (
      <div>
        {specs.description}
        <br/><br/>
        <Table selectable={false}>
          <TableBody displayRowCheckbox={false}>
            {Object.keys(iopDeclaration).map((name, index) => (
                    <TableRow key={name}>
                      {index === 0 ? (
                          <TableRowColumn style={{width: '100px'}} rowSpan={iopDeclaration.length}>
                            Data Type
                          </TableRowColumn>
                      ) : ''}
                      <TableRowColumn style={{width: '100px'}}>{name}</TableRowColumn>
                      <TableRowColumn>
                        <MezuriDeserializedDataType serialized={iopDeclaration[name]} />
                      </TableRowColumn>
                    </TableRow>
            ))}
            <TableRow>
              <TableRowColumn style={{width: '100px'}}>Dependencies</TableRowColumn>
              <TableRowColumn colSpan={2}><MezuriComponentsInfo componentsInfo={specs.dependencies} /></TableRowColumn>
            </TableRow>
            <TableRow>
              <TableRowColumn>Dependents</TableRowColumn>
              <TableRowColumn colSpan={2}><MezuriRegistryLoader
                  urlFragment={getComponentVersionDependentsUrlFragment(componentName, version)}
                  dataKey="dependentsInfo"
              >
                <MezuriDependentsInfo />
              </MezuriRegistryLoader></TableRowColumn>
            </TableRow>
          </TableBody>
        </Table>
      </div>
  );
}


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

  return (
      <SelectableList
          value={currentVersionIndex}
          style={{paddingTop: 0}}
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


function MezuriComponentHeaderInfo({component}) {
  return (
      <div className="component-header-name">
        {component.name} (<a href={component.gitRemoteUrl}>source</a>)
      </div>
  )
}


function MezuriComponentHarness({componentTypeLabel, getComponentUrlFragment, getVersionsUrlFragment, getVersionUrlFragment, children}) {
  return (
      <Route
          path={`/${getVersionsUrlFragment(':componentName')}`}
          render={({match, location}) => (
              <div className="component" style={{display: 'flex', flexFlow: 'column', flex: 1}}>
                <div className="component-header">
                  <div className="component-header-type">
                    {componentTypeLabel}
                  </div>
                  <MezuriRegistryLoader
                      urlFragment={getComponentUrlFragment(match.params.componentName)}
                      dataKey="component"
                  >
                    <MezuriComponentHeaderInfo />
                  </MezuriRegistryLoader>
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexFlow: 'row'
                }}>
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

                  <div style={{flex: 1}} className="component-version-pane">
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
              </div>
          )}
      />
  )
}


function App() {
  return (
      <Router>
        <MuiThemeProvider muiTheme={muiTheme}>
          <Paper
              className="app"
              zDepth={3}
              style={{display: 'flex', flexFlow: 'column'}}
          >
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
                              componentTypeLabel="SOURCE"
                              getComponentUrlFragment={getComponentUrlFragmentByComponentType(componentType)}
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
                              componentTypeLabel="INTERFACE"
                              getComponentUrlFragment={getComponentUrlFragmentByComponentType(componentType)}
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
