import React, {useState, useRef, useEffect} from 'react'
import sabaki from '../modules/sabaki'
import * as gametree from '../modules/gametree'
import Goban from './Goban'

function MainView({
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
}) {

  const [gobanCrosshair, setGobanCrosshair] = useState(false) 

  let board = gametree.getBoard(gameTree, treePosition)
  let paintMap

  if (['scoring', 'estimator'].includes(mode)) {
    paintMap = areaMap
  } else if (mode === 'guess') {
    paintMap = [...Array(board.height)].map(_ => Array(board.width).fill(0))

    for (let [x, y] of blockedGuesses) {
      paintMap[y][x] = 1
    }
  }
  
  const handleGobanVertexClick = (evt) => {
    sabaki.clickVertex(evt.vertex, evt)
  }

  const handleGobanLineDraw = (evt) => {
    let {v1, v2} = evt.line
    sabaki.useTool(this.props.selectedTool, v1, v2)
    sabaki.editVertexData = null
  }
  

  // 容器组件控制棋盘大小
  const mainRef = useRef(null);
  const [maxWidth, setMaxWidth] = useState(400)
  const [maxHeight, setMaxHeight] = useState(400)

  useEffect(() => {
    resize()

    window.addEventListener('resize', () => {
      resize()
    })
  }, [mainRef])

  const resize = () => {
    let {
      offsetWidth: newMaxWidth,
      offsetHeight: newMaxHeight
    } = mainRef.current

    if ( newMaxWidth !== maxWidth || newMaxHeight !== maxHeight ) {
      setMaxWidth(newMaxWidth)
      setMaxHeight(newMaxHeight)
    }
  }

  return (
    <section id='main' ref={mainRef} style={{width: 500, height: 500, marginTop: 60}}>
      <Goban 
        gameTree={gameTree}
        treePosition={treePosition}
        board={board}
        highlightVertices={findVertex && mode === 'find' ? [findVertex] : highlightVertices}
        
        analysisType={analysisType}
        analysis= {showAnalysis && analysisTreePosition != null && analysisTreePosition === treePosition ? analysis : null}
              
        paintMap={paintMap}
        dimmedStones={['scoring', 'estimator'].includes(mode) ? deadStones : []}

        crosshair={gobanCrosshair}
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

        onVertexClick={handleGobanVertexClick}
        onLineDraw={handleGobanLineDraw}

        maxWidth={maxWidth}
        maxHeight={maxHeight}
      />
    </section>
  )
}

export default MainView;