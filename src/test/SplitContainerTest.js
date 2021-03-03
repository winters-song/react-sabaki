import React, {Component} from 'react'
import classNames from 'classnames'

import SplitContainer from '../components/helpers/SplitContainer'

/**
 * 左右分栏布局，可拖拽
 */
export default class SplitContainerTest extends Component{
  constructor(props) {
    super(props);

    this.state = {
      sidebarWidth: 200
    }
    this.handleSideContentChange = ({sideSize}) => {
      this.setState({
        sidebarWidth: sideSize
      })
    }
    this.handleMainLayoutSplitFinish = () => {
      // debugger;
    }
  }

  render() {
    let mainContent = <div className="main"><h1>Main Layout</h1></div>
    let sideContent = <div className="main"><h2>Sidebar Content</h2></div>

    let {
      sidebarWidth
    } = this.state

    return (
      <SplitContainer 
        splitterSize={5} 
        invert={true}
        sideSize={sidebarWidth}
        mainContent={mainContent}
        sideContent={sideContent}

        onChange={this.handleSideContentChange}
        onFinish={this.handleMainLayoutSplitFinish}
      />
    )
  }
}
