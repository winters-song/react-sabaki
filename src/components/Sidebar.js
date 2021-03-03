import React, {Component} from 'react'
import sabaki from '../modules/sabaki.js'

import SplitContainer from './helpers/SplitContainer.js'
import Slider from './sidebars/Slider.js'
import GameGraph from './sidebars/GameGraph.js'
import CommentBox from './sidebars/CommentBox.js'


const setting = require('../setting')

const propertiesMinHeight = setting.get('view.properties_minheight')

export default class Sidebar extends Component {
  constructor() {
    super()

    this.state = {
      sidebarSplit: setting.get('view.properties_height')
    }

    this.handleGraphNodeClick = ({button, gameTree, treePosition, x, y}) => {
      if (button === 0) {
        sabaki.setCurrentTreePosition(gameTree, treePosition)
      } else {
        sabaki.openNodeMenu(treePosition, {x, y})
      }
    }

    this.handleSliderChange = ({percent}) => {
      let moveNumber = Math.round(
        (this.props.gameTree.getHeight() - 1) * percent
      )
      sabaki.goToMoveNumber(moveNumber)
    }

    this.handleSidebarSplitChange = ({sideSize}) => {
      sideSize = Math.min(
        Math.max(propertiesMinHeight, sideSize),
        100 - propertiesMinHeight
      )

      this.setState({sidebarSplit: sideSize})
    }

    this.handleSidebarSplitFinish = () => {
      setting.set('view.properties_height', this.state.sidebarSplit)
    }

    this.handleStartAutoscrolling = ({step}) => {
      sabaki.startAutoscrolling(step)
    }

    this.handleStopAutoscrolling = () => {
      sabaki.stopAutoscrolling()
    }

    this.handleCommentInput = evt => {
      sabaki.setComment(this.props.treePosition, evt)
    }
  }

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.showSidebar != this.props.showSidebar || nextProps.showSidebar
    )
  }
    
  render() {

    let {
      mode,
      lastPlayer,
      gameIndex,
      gameTree,
      gameCurrents,
      treePosition,

      showWinrateGraph,
      showGameGraph,
      showCommentBox,

      graphGridSize,
      graphNodeSize,

      winrateData
    } = this.props
    let {sidebarSplit} = this.state

    let node = gameTree.get(treePosition)
    let level = gameTree.getLevel(treePosition)

    return (
      <section id='sidebar'>
        <SplitContainer
          vertical={true}
          sideSize={!showGameGraph ? 100 : !showCommentBox ? 0 : sidebarSplit}
          procentualSplit={true}

          mainContent={
            <div className='graphproperties'>
              <Slider
                showSlider={showGameGraph}
                text={level}
                percent={gameTree.getHeight() <= 1 ? 0 : (level / (gameTree.getHeight() - 1)) * 100}
                onChange={this.handleSliderChange}
                onStartAutoscrolling={this.handleStartAutoscrolling}
                onStopAutoscrolling={this.handleStopAutoscrolling}
              />

              <GameGraph  
                ref={component => this.gameGraph = component}
                gameTree={gameTree}
                gameCurrents={gameCurrents[gameIndex]}
                treePosition={treePosition}
                showGameGraph={showGameGraph}
                height={!showGameGraph ? 0 : !showCommentBox ? 100 : 100 - sidebarSplit}
                gridSize={graphGridSize}
                nodeSize={graphNodeSize}
                onNodeClick={this.handleGraphNodeClick}
              />
            </div>
          }

          sideContent={
            <CommentBox
              mode={mode}
              gameTree={gameTree}
              treePosition={treePosition}
              showCommentBox={showCommentBox}
              moveAnnotation={ 
                !node? null:
                node.data.BM != null
                ? [-1, node.data.BM[0]]
                : node.data.DO != null
                ? [0, 1]
                : node.data.IT != null
                ? [1, 1]
                : node.data.TE != null
                ? [2, node.data.TE[0]]
                : [null, 1]}
              positionAnnotation={
                !node? null:
                node.data.UC != null
                ? [-2, node.data.UC[0]]
                : node.data.GW != null
                ? [-1, node.data.GW[0]]
                : node.data.DM != null
                ? [0, node.data.DM[0]]
                : node.data.GB != null
                ? [1, node.data.GB[0]]
                : [null, 1]}
              title={!node? '':node.data.N != null ? node.data.N[0] : ''}
              comment={!node? '':node.data.C != null ? node.data.C[0] : ''}
              onCommentInput={this.handleCommentInput}
            />
          }

          onChange={this.handleSidebarSplitChange}
          onFinish={this.handleSidebarSplitFinish}
        />

      </section>
    )
  }
}
