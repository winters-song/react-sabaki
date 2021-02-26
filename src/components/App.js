import React, {Component} from 'react'
import sabaki from '../modules/sabaki'
import MainView from './MainView'
import MainMenu from './MainMenu.js'
import 'antd/dist/antd.css'; 


export default class App extends Component{
  constructor(props) {
    super(props);
    this.state = sabaki.state
  }

  componentDidMount() {
    sabaki.on('change', ({change, callback}) => {
      this.setState(change, callback)
    })
  }

  render(A,B,C) {
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
      engineGameOngoing
    } = this.state

    return (
      <>
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
        <MainView {...this.state}  />
      </>
    )

  }
}
