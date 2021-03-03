import React, {Component} from 'react'
import sabaki from '../modules/sabaki'
import * as gametree from '../modules/gametree'
import Goban from './Goban'


export default class MainView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      gobanCrosshair: false,
      maxWidth: 400,
      maxHeight: 400
    }

    this.handleTogglePlayer = () => {
      let {gameTree, treePosition, currentPlayer} = this.props
      sabaki.setPlayer(treePosition, -currentPlayer)
    }

    this.handleToolButtonClick = evt => {
      sabaki.setState({selectedTool: evt.tool})
    }

    this.handleFindButtonClick = evt =>
      sabaki.findMove(evt.step, {
        vertex: this.props.findVertex,
        text: this.props.findText
      })

    this.handleGobanVertexClick = this.handleGobanVertexClick.bind(this)
    this.handleGobanLineDraw = this.handleGobanLineDraw.bind(this)
  }

  componentDidMount() {
    document.addEventListener('keydown', evt => {
      if (evt.key !== 'Control' || evt.key !== 'Meta') return

      if (this.props.mode === 'edit') {
        this.setState({gobanCrosshair: true})
      }
    })

    document.addEventListener('keyup', evt => {
      if (evt.key !== 'Control' || evt.key !== 'Meta') return

      if (this.props.mode === 'edit') {
        this.setState({gobanCrosshair: false})
      }
    })

    const resize = () => {
      if(!this.mainEl){
        return
      }
      let {
        offsetWidth,
        offsetHeight
      } = this.mainEl

      if ( offsetWidth !== this.state.maxWidth || offsetHeight !== this.state.maxHeight ) {
        this.setState({
          maxWidth: offsetWidth,
          maxHeight: offsetHeight
        })
      }
    }

    window.addEventListener('resize', () => {
      resize()
    })

    resize()

  }

  static getDerivedStateFromProps(nextProps, prevState){
    if (nextProps.mode !== 'edit' && prevState.gobanCrosshair) {
      return {gobanCrosshair: false}
    }
    return null
  }

  handleGobanVertexClick(evt) {
    sabaki.clickVertex(evt.vertex, evt)
  }

  handleGobanLineDraw(evt) {
    let {v1, v2} = evt.line
    sabaki.useTool(this.props.selectedTool, v1, v2)
    sabaki.editVertexData = null
  }

  render() {

    let {
      mode,
      gameIndex,
      gameTree,
      gameCurrents,
      treePosition,
      currentPlayer,
      gameInfo,

      deadStones,
      scoringMethod,
      scoreBoard,
      playVariation,
      analysis,
      analysisTreePosition,
      areaMap,
      blockedGuesses,

      highlightVertices,
      analysisType,
      showAnalysis,
      showCoordinates,
      showMoveColorization,
      showMoveNumbers,
      showNextMoves,
      showSiblings,
      fuzzyStonePlacement,
      animateStonePlacement,
      boardTransformation,

      selectedTool,
      findText,
      findVertex
    } = this.props

    let node = gameTree.get(treePosition)
    let board = gametree.getBoard(gameTree, treePosition)
    let komi = +gametree.getRootProperty(gameTree, 'KM', 0)
    let handicap = +gametree.getRootProperty(gameTree, 'HA', 0)
    let paintMap

    if (['scoring', 'estimator'].includes(mode)) {
      paintMap = areaMap
    } else if (mode === 'guess') {
      paintMap = [...Array(board.height)].map(_ => Array(board.width).fill(0))

      for (let [x, y] of blockedGuesses) {
        paintMap[y][x] = 1
      }
    }

    return (
      <section id='main'  >
        <main ref={el => this.mainEl = el}>
          <Goban 
            gameTree={gameTree}
            treePosition={treePosition}
            board={board}
            highlightVertices={findVertex && mode === 'find' ? [findVertex] : highlightVertices}
            
            analysisType={analysisType}
            analysis= {showAnalysis && analysisTreePosition != null && analysisTreePosition === treePosition ? analysis : null}
                  
            paintMap={paintMap}
            dimmedStones={['scoring', 'estimator'].includes(mode) ? deadStones : []}

            crosshair={this.state.gobanCrosshair}
            showCoordinates={showCoordinates}
            showMoveColorization={showMoveColorization}
            showMoveNumbers= {mode !== 'edit' && showMoveNumbers}
            showNextMoves={mode !== 'guess' && showNextMoves} 
            showSiblings={mode !== 'guess' && showSiblings}
            fuzzyStonePlacement={fuzzyStonePlacement}
            animateStonePlacement={animateStonePlacement}

            playVariation={playVariation}
            drawLineMode={mode === 'edit' && ['arrow', 'line'].includes(selectedTool) ? selectedTool : null}
            transformation={boardTransformation}

            onVertexClick={this.handleGobanVertexClick}
            onLineDraw={this.handleGobanLineDraw}

            maxWidth={this.state.maxWidth}
            maxHeight={this.state.maxHeight}
          />
        </main>
      </section>
    )
  }
}