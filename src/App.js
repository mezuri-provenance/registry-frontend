import React, {PureComponent} from 'react';
import './App.css';
import DataComponent, {ComponentInfo} from './DataComponent';


const timeSeries: ComponentInfo = {
  name: 'time-series',
  description: 'Represents a sequence of points over successive time',
  version: '0.0.2'
};

class App extends PureComponent {
  render() {
    return (
      <div className="App">
        <DataComponent component={timeSeries} />
      </div>
    );
  }
}

export default App;
