// @flow
import React, {PureComponent} from 'react';
import './DataComponent.css'


export type ComponentInfo = {
  name: string,
  description: string,
  version: string,
};


export default class DataComponent extends PureComponent {
  render() {
    const component = this.props.component;
    return (
        <div className="data-component">
          Name: {component.name}
          <br />
          Description: {component.description}
          <br />
          Version: {component.version}
        </div>
    )
  }
}
