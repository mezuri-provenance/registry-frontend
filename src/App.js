import React, {Component} from 'react';

import logo from './logo.svg';
import './App.css';

const registryUrl = 'http://127.0.0.1:5000/sources';

class App extends Component {
  state = {
    sources: null,
  };

  componentDidMount() {
    fetch(registryUrl)
        .then(res => res.json())
        .then(data => this.setState({sources: data.components}))
  }

  render() {
    const {sources} = this.state;

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <div>
          {sources
              ? (sources.map(s => (
                  <ComponentListItem key={s.name}>
                    {s.name}
                  </ComponentListItem>
              )))
              : <div>Loading...</div>
          }
        </div>
      </div>
    );
  }
}

export default App;


const ComponentListItem = ({children}) => (
    <div style={{textAlign: 'left'}}>
      {children}
    </div>
);
