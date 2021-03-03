import React, {Component} from 'react'
import classNames from 'classnames'
import sabaki from '../modules/sabaki'
import MainView from './MainView'
import MainMenu from './MainMenu'
import LeftSidebar from './LeftSidebar'
import Sidebar from './Sidebar'
import 'antd/dist/antd.css'; 
import '../index.css';

import TripleSplitContainer from './helpers/TripleSplitContainer.js'
import i18n from '../i18n.js'

const setting = require('../setting')
const t = i18n.context('App')

const leftSidebarMinWidth = setting.get('view.sidebar_minwidth')
const sidebarMinWidth = setting.get('view.leftsidebar_minwidth')

export default class App extends Component{
  constructor(props) {
    super(props);
    this.state = sabaki.state
    window.sabaki = sabaki

    this.handleMainLayoutSplitChange = this.handleMainLayoutSplitChange.bind(this)
    this.handleMainLayoutSplitFinish = this.handleMainLayoutSplitFinish.bind(this)
  }

  componentDidMount() {

    window.addEventListener('contextmenu', evt => {
      evt.preventDefault()
    })

    sabaki.on('change', ({change, callback}) => {
      this.setState(change, callback)
    })
    
    sabaki.newFile()
  }


  handleMainLayoutSplitChange({beginSideSize, endSideSize}) {
    this.setState(
      ({leftSidebarWidth, sidebarWidth, showLeftSidebar}) => ({
        leftSidebarWidth: showLeftSidebar ? Math.max(beginSideSize, leftSidebarMinWidth) : leftSidebarWidth,
        sidebarWidth: sabaki.inferredState.showSidebar ? Math.max(endSideSize, sidebarMinWidth) : sidebarWidth
      }),
      () => {
        // gameGraph重新绘制等
        window.dispatchEvent(new Event('resize'))
      }
    )
  }

  handleMainLayoutSplitFinish() {
    setting
      .set('view.sidebar_width', this.state.sidebarWidth)
      .set('view.leftsidebar_width', this.state.leftSidebarWidth)
  }

  render() {
    // Calculate some inferred values

    let inferredState = sabaki.inferredState
    let tree = inferredState.gameTree
    let scoreBoard, areaMap

    this.state = {...this.state, ...inferredState}

    let {
      showMenuBar,
      busy,
      analysisType,
      showAnalysis,
      showCoordinates,
      coordinatesType,
      showMoveNumbers,
      showMoveColorization,
      showNextMoves,
      showSiblings,
      showWinrateGraph,
      showGameGraph,
      showCommentBox,
      showLeftSidebar,
      showSidebar,
      mode,
      engineGameOngoing,
      leftSidebarWidth,
      sidebarWidth
    } = this.state

    return (
      <section className={
        classNames({
          showleftsidebar: showLeftSidebar,
          showsidebar: showSidebar,
          [mode]: true
        })
      }>
        <MainMenu
          showMenuBar={showMenuBar}
          disableAll={busy > 0}
          analysisType={analysisType}
          showAnalysis={showAnalysis}
          showCoordinates={showCoordinates}
          coordinatesType={coordinatesType}
          showMoveNumbers={showMoveNumbers}
          showMoveColorization={showMoveColorization}
          showNextMoves={showNextMoves}
          showSiblings={showSiblings}
          showWinrateGraph={showWinrateGraph}
          showGameGraph={showGameGraph}
          showCommentBox={showCommentBox}
          showLeftSidebar={showLeftSidebar}
          engineGameOngoing={engineGameOngoing}
        />

        <TripleSplitContainer
          id='mainlayout'
          beginSideSize={showLeftSidebar ? leftSidebarWidth : 0}
          endSideSize={showSidebar ? sidebarWidth : 0}

          beginSideContent={<LeftSidebar {...this.state} />}
          mainContent={<MainView {...this.state} />}
          endSideContent={<Sidebar {...this.state} />}

          onChange={this.handleMainLayoutSplitChange}
          onFinish={this.handleMainLayoutSplitFinish}
        />
      </section>
    )

  }
}
