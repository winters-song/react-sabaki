import React, {Component} from 'react'
import classNames from 'classnames'

import TripleSplitContainer from '../components/helpers/TripleSplitContainer'

export default class TripleSplitContainerTest extends Component{
  constructor(props) {
    super(props);

    this.state = {
      leftSidebarWidth: 200,
      sidebarWidth: 300
    }
    this.handleMainLayoutSplitChange = this.handleMainLayoutSplitChange.bind(this)
    this.handleMainLayoutSplitFinish = this.handleMainLayoutSplitFinish.bind(this)
  }

  handleMainLayoutSplitChange({beginSideSize, endSideSize}) {
    this.setState({ 
      leftSidebarWidth:beginSideSize, 
      sidebarWidth:endSideSize 
    })
  }

  handleMainLayoutSplitFinish() {
    // setting
    //   .set('view.sidebar_width', this.state.sidebarWidth)
    //   .set('view.leftsidebar_width', this.state.leftSidebarWidth)
  }

  render() {
    let leftSidebar = <div className="leftsidebar"><h2>Left Sidebar</h2></div>
    let mainContent = <div className="main"><h1>Main Layout</h1></div>
    let sideContent = <div className="main"><h2>Sidebar Content</h2></div>

    let {
      leftSidebarWidth,
      sidebarWidth
    } = this.state

    return (
      <TripleSplitContainer 
        id="mainlayout"

        beginSideSize={leftSidebarWidth}
        endSideSize={sidebarWidth}
        splitterSize={5} 
        invert={true}
        sideSize={sidebarWidth}
        beginSideContent={leftSidebar}
        mainContent={mainContent}
        endSideContent={sideContent}

        onChange={this.handleMainLayoutSplitChange}
        onFinish={this.handleMainLayoutSplitFinish}
      />
    )
  }
}
