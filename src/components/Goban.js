import React, {Component} from 'react'

import BoundedGoban from 'react-shudan/src/BoundedGoban'
import 'react-shudan/src/css/goban.css'
import '../App.css'

import classNames from 'classnames'
import sgf from '@sabaki/sgf'
import i18n from '../i18n.js'
import * as gametree from '../modules/gametree.js'
import * as gobantransformer from '../modules/gobantransformer.js'
import * as helper from '../modules/helper.js'

const t = i18n.context('Goban')
const setting = require('../setting')
const alpha = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'

export default class Goban extends Component{

  constructor(props) {
    super(props)
    this.element = React.createRef();


    this.state ={}

    for (let handler of [
      'handleVertexMouseUp',
      'handleVertexMouseDown',
      'handleVertexMouseMove',
      'handleVertexMouseEnter',
      'handleVertexMouseLeave'
    ]) {
      let oldHandler = this[handler].bind(this)
      this[handler] = (evt, vertex) => {
        let transformation = this.props.transformation
        let inverse = gobantransformer.invert(transformation)
        let {width, height} = gobantransformer.transformSize(
          this.props.board.width,
          this.props.board.height,
          transformation
        )

        let originalVertex = gobantransformer.transformVertex(
          vertex,
          inverse,
          width,
          height
        )

        oldHandler(evt, originalVertex)
      }
    }
  }

  componentDidMount() {
    console.log(this.element, this.refs)
    document.addEventListener('mouseup', () => {
      this.mouseDown = false

      if (this.state.temporaryLine) {
        this.setState({temporaryLine: null})
      }
    })

  }

  componentWillReceiveProps(nextProps = {}) {
    if (nextProps.playVariation !== this.props.playVariation) {
      if (nextProps.playVariation != null) {
        let {sign, moves, sibling} = nextProps.playVariation

        this.stopPlayingVariation()
        this.playVariation(sign, moves, sibling)
      } else {
        this.stopPlayingVariation()
      }
    } else if (this.props.treePosition !== nextProps.treePosition) {
      this.stopPlayingVariation()
    }
  }

  handleVertexMouseDown(evt, vertex) {
    this.mouseDown = true
    this.startVertex = vertex
  }

  handleVertexMouseUp(evt, vertex) {
    if (!this.mouseDown) return

    let {onVertexClick = helper.noop, onLineDraw = helper.noop} = this.props

    this.mouseDown = false
    evt.vertex = vertex
    evt.line = this.state.temporaryLine

    if (evt.x == null) evt.x = evt.clientX
    if (evt.y == null) evt.y = evt.clientY

    if (evt.line) {
      onLineDraw(evt)
    } else {
      this.stopPlayingVariation()
      onVertexClick(evt)
    }

    this.setState({clicked: true})
    setTimeout(() => this.setState({clicked: false}), 200)
  }

  handleVertexMouseMove(evt, vertex) {
    let {drawLineMode, onVertexMouseMove = helper.noop} = this.props

    onVertexMouseMove(
      Object.assign(evt, {
        mouseDown: this.mouseDown,
        startVertex: this.startVertex,
        vertex
      })
    )

    if (!!drawLineMode && evt.mouseDown && evt.button === 0) {
      let temporaryLine = {v1: evt.startVertex, v2: evt.vertex}

      if (!helper.equals(temporaryLine, this.state.temporaryLine)) {
        this.setState({temporaryLine})
      }
    }
  }

  handleVertexMouseEnter(evt, vertex) {
    // if (this.props.analysis == null) return

    // let {sign, variations} = this.props.analysis
    // let variation = variations.find(x => helper.vertexEquals(x.vertex, vertex))
    // if (variation == null) return

    // this.playVariation(sign, variation.moves)
  }

  handleVertexMouseLeave(evt, vertex) {
    // this.stopPlayingVariation()
  }

  playVariation(sign, moves, sibling = false) {
    let replayMode = setting.get('board.variation_replay_mode')
    if (replayMode === 'instantly') {
      this.variationIntervalId = true

      this.setState({
        variationMoves: moves,
        variationSign: sign,
        variationSibling: sibling,
        variationIndex: moves.length
      })
    } else if (replayMode === 'move_by_move') {
      clearInterval(this.variationIntervalId)

      this.variationIntervalId = setInterval(() => {
        this.setState(({variationIndex = -1}) => ({
          variationMoves: moves,
          variationSign: sign,
          variationSibling: sibling,
          variationIndex: variationIndex + 1
        }))
      }, setting.get('board.variation_replay_interval'))
    } else {
      this.stopPlayingVariation()
    }
  }

  stopPlayingVariation() {
    if (this.variationIntervalId == null) return

    clearInterval(this.variationIntervalId)
    this.variationIntervalId = null

    this.setState({
      variationMoves: null,
      variationIndex: -1
    })
  }

  render(){

    let {
      gameTree,
      treePosition,
      board,
      paintMap = [],
      analysis,
      analysisType,
      highlightVertices = [],
      dimmedStones = [],

      crosshair = false,
      showCoordinates = false,
      showMoveColorization = true,
      showMoveNumbers = false,
      showNextMoves = true,
      showSiblings = true,
      fuzzyStonePlacement = true,
      animateStonePlacement = true,

      drawLineMode = null,
      transformation = '',
      maxWidth = 100,
      maxHeight = 100,
      clicked = false,
      temporaryLine = null,

      variationMoves = null,
      variationSign = 1,
      variationSibling = false,
      variationIndex = -1,
      onVertexClick
    } = this.props

    let signMap = board.signMap
    let markerMap = board.markers

    let transformLine = line =>
      gobantransformer.transformLine(
        line,
        transformation,
        board.width,
        board.height
      )
    let transformVertex = v =>
      gobantransformer.transformVertex(
        v,
        transformation,
        board.width,
        board.height
      )

  // Calculate coordinates

    let getCoordFunctions = coordinatesType => {
      if (coordinatesType === '1-1') {
        return [x => x + 1, y => y + 1]
      } else if (coordinatesType === 'relative') {
        let relativeCoord = (x, size) => {
          let halfSize = Math.ceil(size / 2)
          if (size === 19 && x === 10) return 'X'

          let ix = size - x + 1
          if (ix < halfSize) return `${ix}*`

          return x.toString()
        }

        return [
          x => relativeCoord(x + 1, board.width),
          y => relativeCoord(board.height - y, board.height)
        ]
      } else {
        return [x => alpha[x], y => board.height - y] // Default
      }
    }

    let coordinatesType = setting.get('view.coordinates_type')
    let coordFunctions = getCoordFunctions(coordinatesType)
    let {coordX, coordY} = gobantransformer.transformCoords(
      coordFunctions[0],
      coordFunctions[1],
      transformation,
      board.width,
      board.height
    )

    let ghostStoneMap = []
    let heatMap = []

    return(
      <BoundedGoban 
        id='goban'
        className={classNames({crosshair})}

        maxWidth={maxWidth}
        maxHeight={maxHeight}

        showCoordinates={showCoordinates}
        coordX= {coordX}
        coordY= {coordY}
        fuzzyStonePlacement = {fuzzyStonePlacement}
        animateStonePlacement = {animateStonePlacement}

        signMap={gobantransformer.transformMap(signMap, transformation)}

        onVertexMouseUp={this.handleVertexMouseUp}
        onVertexMouseDown={this.handleVertexMouseDown}
        onVertexMouseMove={this.handleVertexMouseMove}
        onVertexMouseEnter={this.handleVertexMouseEnter}
        onVertexMouseLeave={this.handleVertexMouseLeave}

        dimmedVertices = {dimmedStones.map(transformVertex)}
        paintMap = {gobantransformer.transformMap(paintMap, transformation, {
          ignoreInvert: true
        })}
        heatMap = {gobantransformer.transformMap(heatMap, transformation)}
        ghostStoneMap = {gobantransformer.transformMap(
          ghostStoneMap,
          transformation
        )}
        selectedVertices= {highlightVertices.map(transformVertex)}
      />
    )
  }
}
