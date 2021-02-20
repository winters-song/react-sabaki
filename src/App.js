import React, {useState, useRef, useEffect} from 'react'
import Goban from 'react-shudan/src/Goban'
// import BoundedGoban from './shudan/BoundedGoban'
import 'react-shudan/src/css/goban.css'
import './App.css'

const Board = require('@sabaki/go-board')

const chineseCoord = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九'
]


const signMap = [
  [0, 0, 0, -1, -1, -1, 1, 0, 1, 1, -1, -1, 0, -1, 0, -1, -1, 1, 0],
  [0, 0, -1, 0, -1, 1, 1, 1, 0, 1, -1, 0, -1, -1, -1, -1, 1, 1, 0],
  [0, 0, -1, -1, -1, 1, 1, 0, 0, 1, 1, -1, -1, 1, -1, 1, 0, 1, 0],
  [0, 0, 0, 0, -1, -1, 1, 0, 1, -1, 1, 1, 1, 1, 1, 0, 1, 0, 0],
  [0, 0, 0, 0, -1, 0, -1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0],
  [0, 0, -1, 0, 0, -1, -1, 1, 0, -1, -1, 1, -1, -1, 0, 1, 0, 0, 1],
  [0, 0, 0, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
  [0, 0, -1, 1, 1, 0, 1, -1, -1, 1, 0, 1, -1, 0, 1, -1, -1, -1, 1],
  [0, 0, -1, -1, 1, 1, 1, 0, -1, 1, -1, -1, 0, -1, -1, 1, 1, 1, 1],
  [0, 0, -1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1],
  [-1, -1, -1, -1, 1, 1, 1, -1, 0, -1, 1, -1, -1, 0, -1, 1, 1, -1, 0],
  [-1, 1, -1, 0, -1, -1, -1, -1, -1, -1, 1, -1, 0, -1, -1, 1, -1, 0, -1],
  [1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 0, 1, -1, 0, -1, 1, -1, -1, 0],
  [0, 1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, -1, 1, 1, -1, 1],
  [0, 0, -1, 1, 0, 0, 1, 1, -1, -1, 0, 1, -1, 1, -1, 1, -1, 0, -1],
  [0, 0, 1, 0, 1, 0, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, 0],
  [0, 0, 0, 0, 1, 1, 0, 1, -1, 0, -1, -1, 1, 1, 1, 1, -1, -1, -1],
  [0, 0, 1, 1, -1, 1, 1, -1, 0, -1, -1, 1, 1, 1, 1, 0, 1, -1, 1],
  [0, 0, 0, 1, -1, -1, -1, -1, -1, 0, -1, -1, 1, 1, 0, 1, 1, 1, 0]
]

const dimmedStones = [
  [2, 14],
  [2, 13],
  [5, 13],
  [6, 13],
  [9, 3],
  [9, 5],
  [10, 5],
  [14, 7],
  [13, 13],
  [13, 14],
  [18, 13]
]

const selectedVertices = [
  [8, 7],
  [9, 7],
  [9, 8],
  [10, 7],
  [10, 8]
]

const lines = [
  {type: 'line', v1: [15, 6], v2: [12, 15]},
  {type: 'arrow', v1: [10, 4], v2: [5, 7]}
]

// 整数转换成(-1,1)的浮点, 用于显示点目不同透明度
const paintMap = [
  [-1, -1, -1, -1, -1, -1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, -1, 1, 1],
  [-1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, 1, 1],
  [-1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, 0, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
  [-1, -1, -1, 1, 1, 1, 1, -1, -1, 1, 0, 1, -1, -1, -1, -1, -1, -1, 1],
  [-1, -1, -1, -1, 1, 1, 1, 0, -1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1],
  [-1, -1, -1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1],
  [-1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, -1],
  [-1, 1, -1, 0, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, -1],
  [1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, -1, -1, 1, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, -1, -1, -1, 1, 1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 0, 1, -1, -1, -1, 1, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1, 1, -1, -1, -1],
  [1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, -1, 1],
  [1, 1, 1, 1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 1]
].map(row => row.map(sign => ((Math.random() * 2 + 1) / 3) * sign))

// 通过box-shadow显示热区
const heatMap = (() => {
  let _ = null
  let O = (strength, text) => ({strength, text})
  let O1 = O(1, '20%\n111')
  let O5 = O(5, '67%\n2315')
  let O9 = O(9, '80%\n13.5k')

  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, O(7), O9, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, O(3), _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, O(2), _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, O1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, O5, O(4), _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _]
  ]
})()

const markerMap = (() => {
  let _ = null
  let O = {type: 'circle'}
  let X = {type: 'cross'}
  let T = {type: 'triangle'}
  let Q = {type: 'square'}
  let $ = {type: 'point'}
  let S = {type: 'loader'}
  let L = label => ({type: 'label', label})
  let A = L('a')
  let B = L('b')
  let C = L('c')
  let longLabel = L('Long\nlabel with linebreak')

  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, O, O, O, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, T, T, T, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, $, $, $, _, _, _, _, _, _, _, _, _, _, _, S, S, S, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, Q, _, _, _, _, _, _, _, _, _, longLabel],
    [_, _, _, _, _, _, _, _, Q, _, _, _, _, _, _, _, _, _, C],
    [_, _, _, _, _, _, _, _, Q, _, _, _, _, _, _, _, _, _, B],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, A]
  ]
})()

const ghostStoneMap = (() => {
  let _ = null
  let O = t => ({sign: -1, type: t})
  let X = t => ({sign: 1, type: t})
  let o = t => ({sign: -1, type: t, faint: true})
  let x = t => ({sign: 1, type: t, faint: true})
  let [Xg, xg] = [X, x].map(f => f('good'))
  let [Xb, xb] = [X, x].map(f => f('bad'))
  let [Xi, xi] = [X, x].map(f => f('interesting'))
  let [Xd, xd] = [X, x].map(f => f('doubtful'))

  return [
    [X(), x(), _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [O(), o(), _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xg, xg, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xi, xi, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xd, xd, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xb, xb, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _]
  ]
})()

function CheckBox({setter, value, text}) {
  return (
    <label>
      <input type="checkbox" checked={value} onChange={() => {
        setter(!value)
      }}/>
      <span>{text}</span>
    </label>
  )
}


function App() {
  // 棋盘单位尺寸
  const [vertexSize, setVertexSize] = useState(24)
  // 显示坐标
  const [showCoordinates, setShowCoordinates] = useState(true)
  // 坐标显示切换
  const [alternateCoordinates, setAlternateCoordinates] = useState(false)
  const [showCorner, setShowCorner] = useState(false)
  const [showDimmedStones, setShowDimmedStones] = useState(false)
  const [fuzzyStonePlacement, setFuzzyStonePlacement] = useState(false)
  const [animateStonePlacement, setAnimateStonePlacement] = useState(false)
  const [showPaintMap, setShowPaintMap] = useState(false)
  const [showHeatMap, setShowHeatMap] = useState(false)
  const [showMarkerMap, setShowMarkerMap] = useState(false)
  const [showGhostStones, setShowGhostStones] = useState(false)
  const [showLines, setShowLines] = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const [board, setBoard] = useState(new Board(signMap))

  const boardRef = useRef(board)
  
  const handleMouseUp = (evt, [x, y]) => {
    let sign = evt.button === 0 ? 1 : -1
    let newBoard = boardRef.current.makeMove(sign, [x, y])
    setBoard(newBoard)
  };

  useEffect(()=> {
    boardRef.current = board
  }, [board]);
 
  return (
    <>
      <section style={{display: 'grid', gridTemplateColumns: '15em auto', gridColumnGap: '1em'}}>
        <form className="gui-form">
          <p>
            {"Size: "}
            <button type="button" onClick={() => {
              setVertexSize(Math.max(vertexSize - 4, 4))
            }}> - </button>
            {" "}
            <button type="button" onClick={() => {
              setVertexSize(24)
            }}> • </button>
            {" "}
            <button type="button" onClick={() => {
              setVertexSize(vertexSize + 4)
            }}> + </button>
          </p>

          <p>
            {"Stones: "}
            <button type="button" onClick={() => {
              setBoard(new Board(signMap))
            }}> • </button>
          </p>

          <CheckBox value={showCoordinates} setter={setShowCoordinates} text="Show coordinates" />
          <CheckBox value={alternateCoordinates} setter={setAlternateCoordinates} text="Alternate coordinates" />
          <CheckBox value={showCorner} setter={setShowCorner} text="Show lower right corner only" />
          <CheckBox value={showDimmedStones} setter={setShowDimmedStones} text="Dim dead stones" />
          <CheckBox value={fuzzyStonePlacement} setter={setFuzzyStonePlacement} text="Fuzzy stone placement" />
          <CheckBox value={animateStonePlacement} setter={setAnimateStonePlacement} text="Animate stone placement" />
          <CheckBox value={showMarkerMap} setter={setShowMarkerMap} text="Show markers" />
          <CheckBox value={showGhostStones} setter={setShowGhostStones} text="Show ghost stones" />
          <CheckBox value={showPaintMap} setter={setShowPaintMap} text="Show paint map" />
          <CheckBox value={showHeatMap} setter={setShowHeatMap} text="Show heat map" />
          <CheckBox value={showLines} setter={setShowLines} text="Show lines" />
          <CheckBox value={showSelection} setter={setShowSelection} text="Show selection" />
          <CheckBox value={isBusy} setter={setIsBusy} text="Busy" />
        </form>

        <div>
          <Goban 
            vertexSize={vertexSize}
            animate={true}
            busy={isBusy}
            rangeX={showCorner ? [8, 18] : undefined}
            rangeY= {showCorner ? [12, 18] : undefined}
            coordX= {alternateCoordinates ? i => chineseCoord[i] : undefined}
            coordY= {alternateCoordinates ? i => i + 1 : undefined}
            signMap={board.signMap}
            showCoordinates={showCoordinates}

            onVertexMouseUp= {handleMouseUp}

            dimmedVertices = {showDimmedStones ? dimmedStones : []}
            fuzzyStonePlacement = {fuzzyStonePlacement}
            animateStonePlacement = {animateStonePlacement}
            paintMap = {showPaintMap && paintMap}
            heatMap = {showHeatMap && heatMap}
            markerMap = {showMarkerMap && markerMap}
            ghostStoneMap = {showGhostStones && ghostStoneMap}
            selectedVertices= {showSelection ? selectedVertices : []}
            lines = {showLines ? lines : []}
          />

          {
            alternateCoordinates && (
              <style> 
              {`
              .shudan-coordx span {
                font-size: .45em;
              }
              `}
              </style>
            )
          }
        </div>
      </section>
    </>
  );
}

export default App;
