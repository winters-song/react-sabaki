import EventEmitter from 'events'
import Board from '@sabaki/go-board'
import sgf from '@sabaki/sgf'

import i18n from '../i18n.js'
// import * as dialog from './dialog.js'
import * as fileformats from './fileformats/index.js'
import * as gametree from './gametree.js'
import * as gobantransformer from './gobantransformer.js'
import * as helper from './helper.js'
import * as sound from './sound.js'

const setting = require('../setting')

class Sabaki extends EventEmitter {
  constructor() {
    super()

    let emptyTree = gametree.new()

    this.state = {
      mode: 'play',
      openDrawer: null,
      busy: 0,
      fullScreen: false,
      showMenuBar: null,
      zoomFactor: null,

      representedFilename: null,
      gameIndex: 0,
      gameTrees: [emptyTree],
      gameCurrents: [{}],
      treePosition: emptyTree.root.id,

      // Bars

      selectedTool: 'stone_1',
      scoringMethod: null,
      findText: '',
      findVertex: null,
      deadStones: [],
      blockedGuesses: [],

      // Goban

      highlightVertices: [],
      playVariation: null,
      analysisType: null,
      coordinatesType: null,
      showAnalysis: null,
      showCoordinates: null,
      showMoveColorization: null,
      showMoveNumbers: null,
      showNextMoves: null,
      showSiblings: null,
      fuzzyStonePlacement: null,
      animateStonePlacement: null,
      boardTransformation: '',

      // Sidebar

      consoleLog: [],
      showLeftSidebar: setting.get('view.show_leftsidebar'),
      leftSidebarWidth: setting.get('view.leftsidebar_width'),
      showWinrateGraph: setting.get('view.show_winrategraph'),
      showGameGraph: setting.get('view.show_graph'),
      showCommentBox: setting.get('view.show_comments'),
      sidebarWidth: setting.get('view.sidebar_width'),
      graphGridSize: null,
      graphNodeSize: null,

      // Engines

      engines: null,
      attachedEngineSyncers: [],
      analyzingEngineSyncerId: null,
      blackEngineSyncerId: null,
      whiteEngineSyncerId: null,
      engineGameOngoing: null,
      analysisTreePosition: null,
      analysis: null,

      // Drawers

      preferencesTab: 'general',

      // Input Box

      showInputBox: false,
      inputBoxText: '',
      onInputBoxSubmit: helper.noop,
      onInputBoxCancel: helper.noop,

      // Info Overlay

      infoOverlayText: '',
      showInfoOverlay: false
    }

    this.events = new EventEmitter()

    this.treeHash = this.generateTreeHash()
    this.historyPointer = 0
    this.history = []
    this.recordHistory()

    // Bind state to settings

    setting.events.on('change', ({key, value}) => {
      this.updateSettingState(key)
    })

    this.updateSettingState()
  }

  setState(change, callback = null) {
    if (typeof change === 'function') {
      change = change(this.state)
    }

    Object.assign(this.state, change)

    this.emit('change', {change, callback})
  }

  getInferredState(state) {
    let self = this

    return {
      get gameTree() {
        return state.gameTrees[state.gameIndex]
      },
      get showSidebar() {
        return state.showGameGraph || state.showCommentBox
      },
      get gameInfo() {
        return self.getGameInfo()
      },
      get currentPlayer() {
        return self.getPlayer(state.treePosition)
      },
      get lastPlayer() {
        let node = this.gameTree.get(state.treePosition)
        if(!node) {
          return
        }

        return 'B' in node.data
          ? 1
          : 'W' in node.data
          ? -1
          : -this.currentPlayer
      },
      get board() {
        let b = gametree.getBoard(this.gameTree, state.treePosition)
        return b
      },
      get winrateData() {
        return [
          ...this.gameTree.listCurrentNodes(state.gameCurrents[state.gameIndex])
        ].map(x => x.data.SBKV && x.data.SBKV[0])
      }
    }
  }

  get inferredState() {
    return this.getInferredState(this.state)
  }

  updateSettingState(key = null) {
    let data = {
      'app.zoom_factor': 'zoomFactor',
      'board.analysis_type': 'analysisType',
      'board.show_analysis': 'showAnalysis',
      'view.show_menubar': 'showMenuBar',
      'view.show_coordinates': 'showCoordinates',
      'view.show_move_colorization': 'showMoveColorization',
      'view.show_move_numbers': 'showMoveNumbers',
      'view.show_next_moves': 'showNextMoves',
      'view.show_siblings': 'showSiblings',
      'view.coordinates_type': 'coordinatesType',
      'view.fuzzy_stone_placement': 'fuzzyStonePlacement',
      'view.animated_stone_placement': 'animateStonePlacement',
      'graph.grid_size': 'graphGridSize',
      'graph.node_size': 'graphNodeSize',
      'engines.list': 'engines',
      'scoring.method': 'scoringMethod'
    }

    if (key == null) {
      for (let k in data) this.updateSettingState(k)
      return
    }

    if (key in data) {
      this.setState({[data[key]]: setting.get(key)})
    }
  }

  async waitForRender() {
    return new Promise(resolve => this.setState({}, resolve))
  }

  // User Interface

  setMode(mode) {
    if (this.state.mode === mode) return

    let stateChange = {mode}

    if (['scoring', 'estimator'].includes(mode)) {
      // Guess dead stones

      let {gameIndex, gameTrees, treePosition} = this.state
      let iterations = setting.get('score.estimator_iterations')
      let tree = gameTrees[gameIndex]

    } else if (mode === 'edit') {
      this.waitForRender().then(() => {
        let textarea = document.querySelector('#properties .edit textarea')

        textarea.selectionStart = textarea.selectionEnd = 0
        textarea.focus()
      })
    }

    this.setState(stateChange)
    this.events.emit('modeChange')
  }

  openDrawer(drawer) {
    this.setState({openDrawer: drawer})
  }

  closeDrawer() {
    this.openDrawer(null)
  }

  setBusy(busy) {
    let diff = busy ? 1 : -1
    this.setState(s => ({busy: Math.max(s.busy + diff, 0)}))
  }

  showInfoOverlay(text) {
    this.setState({
      infoOverlayText: text,
      showInfoOverlay: true
    })
  }

  hideInfoOverlay() {
    this.setState({showInfoOverlay: false})
  }

  flashInfoOverlay(text, duration = null) {
    if (duration == null) duration = setting.get('infooverlay.duration')

    this.showInfoOverlay(text)

    clearTimeout(this.hideInfoOverlayId)
    this.hideInfoOverlayId = setTimeout(() => this.hideInfoOverlay(), duration)
  }

  clearConsole() {
    this.setState({consoleLog: []})
  }

  // History Management

  recordHistory({prevGameIndex, prevTreePosition} = {}) {
    let currentEntry = this.history[this.historyPointer]
    let newEntry = {
      gameIndex: this.state.gameIndex,
      gameTrees: this.state.gameTrees,
      treePosition: this.state.treePosition,
      timestamp: Date.now()
    }

    if (
      currentEntry != null &&
      helper.shallowEquals(currentEntry.gameTrees, newEntry.gameTrees)
    )
      return

    this.history = this.history.slice(
      -setting.get('edit.max_history_count'),
      this.historyPointer + 1
    )

    if (
      currentEntry != null &&
      newEntry.timestamp - currentEntry.timestamp <
        setting.get('edit.history_batch_interval')
    ) {
      this.history[this.historyPointer] = newEntry
    } else {
      if (
        currentEntry != null &&
        prevGameIndex != null &&
        prevTreePosition != null
      ) {
        currentEntry.gameIndex = prevGameIndex
        currentEntry.treePosition = prevTreePosition
      }

      this.history.push(newEntry)
      this.historyPointer = this.history.length - 1
    }
  }

  clearHistory() {
    this.history = []
    this.recordHistory()
  }

  checkoutHistory(historyPointer) {
    let entry = this.history[historyPointer]
    if (entry == null) return

    let gameTree = entry.gameTrees[entry.gameIndex]

    this.historyPointer = historyPointer
    this.setState({
      gameIndex: entry.gameIndex,
      gameTrees: entry.gameTrees,
      gameCurrents: entry.gameTrees.map(_ => ({}))
    })

    this.setCurrentTreePosition(gameTree, entry.treePosition, {
      clearCache: true
    })
  }

  undo() {
    this.checkoutHistory(this.historyPointer - 1)
  }

  redo() {
    this.checkoutHistory(this.historyPointer + 1)
  }

  // File Management

  getEmptyGameTree() {
    let handicap = setting.get('game.default_handicap')
    let size = setting
      .get('game.default_board_size')
      .toString()
      .split(':')
      .map(x => +x)
    let [width, height] = [size[0], size.slice(-1)[0]]
    let handicapStones = Board.fromDimensions(width, height)
      .getHandicapPlacement(handicap)
      .map(sgf.stringifyVertex)

    let sizeInfo = width === height ? width.toString() : `${width}:${height}`
    let date = new Date()
    let dateInfo = sgf.stringifyDates([
      [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    ])

    return gametree.new().mutate(draft => {
      let rootData = {
        GM: ['1'],
        FF: ['4'],
        CA: ['UTF-8'],
        AP: [`${this.appName}:${this.version}`],
        KM: [setting.get('game.default_komi')],
        SZ: [sizeInfo],
        DT: [dateInfo]
      }

      if (handicapStones.length > 0) {
        Object.assign(rootData, {
          HA: [handicap.toString()],
          AB: handicapStones
        })
      }

      for (let prop in rootData) {
        draft.updateProperty(draft.root.id, prop, rootData[prop])
      }
    })
  }

  async newFile({
    playSound = false,
    showInfo = false,
    suppressAskForSave = false
  } = {}) {
    if (!suppressAskForSave && !this.askForSave()) return

    let [blackName, whiteName] = [
      this.state.blackEngineSyncerId,
      this.state.whiteEngineSyncerId
    ]
      .map(id =>
        this.state.attachedEngineSyncers.find(syncer => syncer.id === id)
      )
      .map(syncer => (syncer == null ? null : syncer.engine.name))

    let emptyTree = gametree.setGameInfo(this.getEmptyGameTree(), {
      blackName,
      whiteName
    })

    await this.loadGameTrees([emptyTree], {suppressAskForSave: true})

    if (showInfo) this.openDrawer('info')
    if (playSound) sound.playNewGame()
  }

  async loadFile(
    filename = null,
    {suppressAskForSave = false, clearHistory = true} = {}
  ) {
    if (!suppressAskForSave && !this.askForSave()) return

    let t = i18n.context('sabaki.file')

    if (!filename) {
    
      let input = document.createElement('input');
      input.value = '选择文件';
      input.type = 'file';
      input.accept = '.sgf'
      input.onchange = event => {
        let file = event.target.files[0];
        let file_reader = new FileReader();
        file_reader.onload = async () => {
          let content = file_reader.result;

          await this.loadContent(content, 'sgf', {suppressAskForSave, clearHistory}) 
        };
        file_reader.readAsText(file, 'UTF-8');
      };
      input.click();
      return
    }
  }

  async loadContent(content, extension, options = {}) {
    this.setBusy(true)

    let t = i18n.context('sabaki.file')
    let gameTrees = []
    let success = true
    let lastProgress = -1

    try {
      let fileFormatModule = fileformats.getModuleByExtension(extension)

      gameTrees = fileFormatModule.parse(content, evt => {
        if (evt.progress - lastProgress < 0.1) return
        this.window.setProgressBar(evt.progress)
        lastProgress = evt.progress
      })

      if (gameTrees.length == 0) throw true
    } catch (err) {
      // dialog.showMessageBox(t('This file is unreadable.'), 'warning')
      success = false
    }

    if (success) {
      await this.loadGameTrees(gameTrees, options)

      if (setting.get('game.goto_end_after_loading')) {
        this.goToEnd()
      }
    }

    this.setBusy(false)
  }

  async loadGameTrees(
    gameTrees,
    {suppressAskForSave = false, clearHistory = true} = {}
  ) {
    if (!suppressAskForSave && !this.askForSave()) return

    this.setBusy(true)
    if (this.state.openDrawer !== 'gamechooser') this.closeDrawer()
    this.setMode('play')

    await helper.wait(setting.get('app.loadgame_delay'))

    if (gameTrees.length > 0) {
      this.setState({
        representedFilename: null,
        gameIndex: 0,
        gameTrees,
        gameCurrents: gameTrees.map(_ => ({})),

        boardTransformation: ''
      })

      let [firstTree] = gameTrees
      this.setCurrentTreePosition(firstTree, firstTree.root.id, {
        clearCache: true
      })

      this.treeHash = this.generateTreeHash()
      this.fileHash = this.generateFileHash()

      if (clearHistory) this.clearHistory()
    }

    this.setBusy(false)
    this.events.emit('fileLoad')

    if (gameTrees.length > 1) {
      await helper.wait(setting.get('gamechooser.show_delay'))
      this.openDrawer('gamechooser')
    }
  }

  saveFile(filename = null, confirmExtension = true) {
    let t = i18n.context('sabaki.file')

    this.setBusy(true)

    let data = this.getSGF()

    let blob = new Blob([data], {type: 'text/json'})
    let e = document.createEvent('MouseEvents')
    let a = document.createElement('a')

    filename = filename || '1.sgf'
    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')

    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)

    this.setBusy(false)
    this.setState({representedFilename: filename})

    this.treeHash = this.generateTreeHash()
    this.fileHash = this.generateFileHash()

    return true
  }

  getSGF() {
    let {gameTrees} = this.state

    gameTrees = gameTrees.map(tree =>
      tree.mutate(draft => {
        draft.updateProperty(draft.root.id, 'AP', [
          `${this.appName}:${this.version}`
        ])
        draft.updateProperty(draft.root.id, 'CA', ['UTF-8'])
      })
    )

    this.setState({gameTrees})
    this.recordHistory()

    return sgf.stringify(
      gameTrees.map(tree => tree.root),
      {
        linebreak: setting.get('sgf.format_code') ? helper.linebreak : ''
      }
    )
  }

  getBoardAscii() {
    let {boardTransformation} = this.state
    let tree = this.state.gameTrees[this.state.gameIndex]
    let board = gametree.getBoard(tree, this.state.treePosition)
    let signMap = gobantransformer.transformMap(
      board.signMap,
      boardTransformation
    )
    let markerMap = gobantransformer.transformMap(
      board.markers,
      boardTransformation
    )
    let lines = board.lines.map(l =>
      gobantransformer.transformLine(
        l,
        boardTransformation,
        board.width,
        board.height
      )
    )

    let height = signMap.length
    let width = height === 0 ? 0 : signMap[0].length
    let result = []
    let lb = helper.linebreak

    let getIndexFromVertex = ([x, y]) => {
      let rowLength = 4 + width * 2
      return rowLength + rowLength * y + 1 + x * 2 + 1
    }

    // Make empty board

    result.push('+')
    for (let x = 0; x < width; x++) result.push('-', '-')
    result.push('-', '+', lb)

    for (let y = 0; y < height; y++) {
      result.push('|')
      for (let x = 0; x < width; x++) result.push(' ', '.')
      result.push(' ', '|', lb)
    }

    result.push('+')
    for (let x = 0; x < width; x++) result.push('-', '-')
    result.push('-', '+', lb)

    for (let vertex of board.getHandicapPlacement(9)) {
      result[getIndexFromVertex(vertex)] = ','
    }

    // Place markers & stones

    let data = {
      plain: ['O', null, 'X'],
      circle: ['W', 'C', 'B'],
      square: ['@', 'S', '#'],
      triangle: ['Q', 'T', 'Y'],
      cross: ['P', 'M', 'Z'],
      label: ['O', null, 'X']
    }

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let i = getIndexFromVertex([x, y])
        let s = signMap[y][x]

        if (!markerMap[y][x] || !(markerMap[y][x].type in data)) {
          if (s !== 0) result[i] = data.plain[s + 1]
        } else {
          let {type, label} = markerMap[y][x]

          if (type !== 'label' || s !== 0) {
            result[i] = data[type][s + 1]
          } else if (
            s === 0 &&
            label.length === 1 &&
            isNaN(parseFloat(label))
          ) {
            result[i] = label.toLowerCase()
          }
        }
      }
    }

    result = result.join('')

    // Add lines & arrows

    for (let {v1, v2, type} of lines) {
      result += `{${type === 'arrow' ? 'AR' : 'LN'} ${board.stringifyVertex(
        v1
      )} ${board.stringifyVertex(v2)}}${lb}`
    }

    return (lb + result.trim())
      .split(lb)
      .map(l => `$$ ${l}`)
      .join(lb)
  }

  generateTreeHash() {
    return this.state.gameTrees.map(tree => tree.getHash()).join('-')
  }

  generateFileHash() {
    let {representedFilename} = this.state
    if (!representedFilename) return null

    try {
      // let content = fs.readFileSync(representedFilename, 'utf8')
      let content = representedFilename
      return helper.hash(content)
    } catch (err) {}

    return null
  }

  askForSave() {
    let t = i18n.context('sabaki.file')
    let hash = this.generateTreeHash()

    if (hash !== this.treeHash) {
      let answer = window.confirm("Your changes will be lost if you close this file without saving.")

      if(answer){
        this.saveFile(this.state.representedFilename)
      }
      // let answer = dialog.showMessageBox(
      //   t('Your changes will be lost if you close this file without saving.'),
      //   'warning',
      //   [t('Save'), t('Don’t Save'), t('Cancel')],
      //   2
      // )
    }

    return true
  }
  // Playing

  clickVertex(vertex, {button = 0, ctrlKey = false, x = 0, y = 0} = {}) {
    this.closeDrawer()

    let t = i18n.context('sabaki.play')
    let {gameTrees, gameIndex, gameCurrents, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let board = gametree.getBoard(tree, treePosition)
    let node = tree.get(treePosition)

    if (typeof vertex == 'string') {
      vertex = board.parseVertex(vertex)
    }

    let [vx, vy] = vertex

    if (['play', 'autoplay'].includes(this.state.mode)) {
      if (button === 0) {
        if (board.get(vertex) === 0) {
          this.makeMove(vertex, {
            generateEngineMove: false //this.state.engineGameOngoing == null
          })
        } else if (
          board.markers[vy][vx] != null &&
          board.markers[vy][vx].type === 'point' &&
          setting.get('edit.click_currentvertex_to_remove')
        ) {
          this.removeNode(treePosition)
        }
      } else if (button === 2) {
        if (
          board.markers[vy][vx] != null &&
          board.markers[vy][vx].type === 'point'
        ) {
          // Show annotation context menu

          this.openCommentMenu(treePosition, {x, y})
        } else if (
          this.state.analysis != null &&
          this.state.analysisTreePosition === this.state.treePosition
        ) {
          // Show analysis context menu

          let {sign, variations} = this.state.analysis
          let variation = variations.find(x =>
            helper.vertexEquals(x.vertex, vertex)
          )

          if (variation != null) {
            let maxVisitsWin = Math.max(
              ...variations.map(x => x.visits * x.winrate)
            )
            let strength =
              Math.round(
                (variation.visits * variation.winrate * 8) / maxVisitsWin
              ) + 1
            let annotationProp =
              strength >= 8
                ? 'TE'
                : strength >= 5
                ? 'IT'
                : strength >= 3
                ? 'DO'
                : 'BM'
            let annotationValues = {BM: '1', DO: '', IT: '', TE: '1'}
            let winrate =
              Math.round(
                (sign > 0 ? variation.winrate : 100 - variation.winrate) * 100
              ) / 100

            this.openVariationMenu(sign, variation.moves, {
              x,
              y,
              startNodeProperties: {
                [annotationProp]: [annotationValues[annotationProp]],
                SBKV: [winrate.toString()]
              }
            })
          }
        }
      }
    } else if (this.state.mode === 'edit') {
      if (ctrlKey) {
        // Add coordinates to comment

        let coord = board.stringifyVertex(vertex)
        let commentText = node.data.C ? node.data.C[0] : ''

        let newTree = tree.mutate(draft => {
          draft.updateProperty(
            node.id,
            'C',
            commentText !== '' ? [commentText.trim() + ' ' + coord] : [coord]
          )
        })

        this.setCurrentTreePosition(newTree, node.id)
        return
      }

      let tool = this.state.selectedTool

      if (button === 2) {
        // Right mouse click

        if (['stone_1', 'stone_-1'].includes(tool)) {
          // Switch stone tool

          tool = tool === 'stone_1' ? 'stone_-1' : 'stone_1'
        } else if (['number', 'label'].includes(tool)) {
          // Show label editing context menu

          // helper.popupMenu(
          //   [
          //     {
          //       label: t('&Edit Label'),
          //       click: async () => {
          //         let value = await dialog.showInputBox(t('Enter label text'))
          //         if (value == null) return

          //         this.useTool('label', vertex, value)
          //       }
          //     }
          //   ],
          //   x,
          //   y
          // )

          return
        }
      }

      if (['line', 'arrow'].includes(tool)) {
        // Remember clicked vertex and pass as an argument the second time

        if (!this.editVertexData || this.editVertexData[0] !== tool) {
          this.useTool(tool, vertex)
          this.editVertexData = [tool, vertex]
        } else {
          this.useTool(tool, this.editVertexData[1], vertex)
          this.editVertexData = null
        }
      } else {
        this.useTool(tool, vertex)
        this.editVertexData = null
      }
    } else if (['scoring', 'estimator'].includes(this.state.mode)) {
      if (button !== 0 || board.get(vertex) === 0) return

      let {mode, deadStones} = this.state
      let dead = deadStones.some(v => helper.vertexEquals(v, vertex))
      let stones =
        mode === 'estimator'
          ? board.getChain(vertex)
          : board.getRelatedChains(vertex)

      if (!dead) {
        deadStones = [...deadStones, ...stones]
      } else {
        deadStones = deadStones.filter(
          v => !stones.some(w => helper.vertexEquals(v, w))
        )
      }

      this.setState({deadStones})
    } else if (this.state.mode === 'find') {
      if (button !== 0) return

      if (helper.vertexEquals(this.state.findVertex || [-1, -1], vertex)) {
        this.setState({findVertex: null})
      } else {
        this.setState({findVertex: vertex})
        this.findMove(1, {vertex, text: this.state.findText})
      }
    } else if (this.state.mode === 'guess') {
      if (button !== 0) return

      let nextNode = tree.navigate(treePosition, 1, gameCurrents[gameIndex])
      if (
        nextNode == null ||
        (nextNode.data.B == null && nextNode.data.W == null)
      ) {
        return this.setMode('play')
      }

      let nextVertex = sgf.parseVertex(
        nextNode.data[nextNode.data.B != null ? 'B' : 'W'][0]
      )
      let board = gametree.getBoard(tree, treePosition)
      if (!board.has(nextVertex)) {
        return this.setMode('play')
      }

      if (helper.vertexEquals(vertex, nextVertex)) {
        this.makeMove(vertex, {player: nextNode.data.B != null ? 1 : -1})
      } else {
        if (
          board.get(vertex) !== 0 ||
          this.state.blockedGuesses.some(v => helper.vertexEquals(v, vertex))
        )
          return

        let blocked = []
        let [, i] = vertex
          .map((x, i) => Math.abs(x - nextVertex[i]))
          .reduce(([max, i], x, j) => (x > max ? [x, j] : [max, i]), [
            -Infinity,
            -1
          ])

        for (let x = 0; x < board.width; x++) {
          for (let y = 0; y < board.height; y++) {
            let z = i === 0 ? x : y
            if (Math.abs(z - vertex[i]) < Math.abs(z - nextVertex[i]))
              blocked.push([x, y])
          }
        }

        let {blockedGuesses} = this.state
        blockedGuesses.push(...blocked)
        this.setState({blockedGuesses})
      }
    }

    this.events.emit('vertexClick')
  }

  makeMove(vertex, {player = null, generateEngineMove = false} = {}) {
    if (!['play', 'autoplay', 'guess'].includes(this.state.mode)) {
      this.closeDrawer()
      this.setMode('play')
    }

    let t = i18n.context('sabaki.play')
    let {gameTrees, gameIndex, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let node = tree.get(treePosition)
    let board = gametree.getBoard(tree, treePosition)

    if (!player) player = this.getPlayer(treePosition)
    if (typeof vertex == 'string') vertex = board.parseVertex(vertex)

    let {pass, overwrite, capturing, suicide} = board.analyzeMove(
      player,
      vertex
    )
    if (!pass && overwrite) return

    let prev = tree.get(node.parentId)
    let color = player > 0 ? 'B' : 'W'
    let ko = false

    if (!pass) {
      if (prev != null && setting.get('game.show_ko_warning')) {
        let nextBoard = board.makeMove(player, vertex)
        let prevBoard = gametree.getBoard(tree, prev.id)

        ko = helper.equals(prevBoard.signMap, nextBoard.signMap)

        // if (
        //   ko &&
        //   dialog.showMessageBox(
        //     t(
        //       [
        //         'You are about to play a move which repeats a previous board position.',
        //         'This is invalid in some rulesets.'
        //       ].join('\n')
        //     ),
        //     'info',
        //     [t('Play Anyway'), t('Don’t Play')],
        //     1
        //   ) != 0
        // )
        //   return
      }

      if (suicide && setting.get('game.show_suicide_warning')) {
        // if (
        //   dialog.showMessageBox(
        //     t(
        //       [
        //         'You are about to play a suicide move.',
        //         'This is invalid in some rulesets.'
        //       ].join('\n')
        //     ),
        //     'info',
        //     [t('Play Anyway'), t('Don’t Play')],
        //     1
        //   ) != 0
        // )
        //   return
      }
    }

    // Update data

    let nextTreePosition
    let newTree = tree.mutate(draft => {
      nextTreePosition = draft.appendNode(treePosition, {
        [color]: [sgf.stringifyVertex(vertex)]
      })
    })

    let createNode = tree.get(nextTreePosition) == null

    this.setCurrentTreePosition(newTree, nextTreePosition)

    // Play sounds

    if (!pass) {
      sound.playPachi()
      if (capturing || suicide) sound.playCapture()
    } else {
      sound.playPass()
    }

    // Enter scoring mode after two consecutive passes

    let enterScoring = false

    if (pass && createNode && prev != null) {
      let prevColor = color === 'B' ? 'W' : 'B'
      let prevPass =
        node.data[prevColor] != null && node.data[prevColor][0] === ''

      if (prevPass) {
        enterScoring = true
        this.setMode('scoring')
      }
    }

    // Emit event

    this.events.emit('moveMake', {pass, capturing, suicide, ko, enterScoring})

    // Generate move

    if (generateEngineMove && !enterScoring) {
      this.generateMove(
        player > 0
          ? this.state.whiteEngineSyncerId
          : this.state.blackEngineSyncerId,
        nextTreePosition
      )
    }
  }

  makeResign({player = null} = {}) {
    let {gameTrees, gameIndex, treePosition} = this.state
    let {currentPlayer} = this.inferredState
    if (player == null) player = currentPlayer
    let color = player > 0 ? 'W' : 'B'
    let tree = gameTrees[gameIndex]

    let newTree = tree.mutate(draft => {
      draft.updateProperty(draft.root.id, 'RE', [`${color}+Resign`])
    })

    this.makeMainVariation(treePosition)
    this.makeMove([-1, -1], {player})

    this.events.emit('resign', {player})
  }

  useTool(tool, vertex, argument = null) {
    let {gameTrees, gameIndex, treePosition} = this.state
    let {currentPlayer} = this.inferredState
    let tree = gameTrees[gameIndex]
    let board = gametree.getBoard(tree, treePosition)
    let node = tree.get(treePosition)

    if (typeof vertex == 'string') {
      vertex = board.parseVertex(vertex)
    }

    let data = {
      cross: 'MA',
      triangle: 'TR',
      circle: 'CR',
      square: 'SQ',
      number: 'LB',
      label: 'LB'
    }

    let newTree = tree.mutate(draft => {
      if (['stone_-1', 'stone_1'].includes(tool)) {
        if (
          node.data.B != null ||
          node.data.W != null ||
          node.children.length > 0
        ) {
          // New child needed

          let id = draft.appendNode(treePosition, {
            PL: currentPlayer > 0 ? ['B'] : ['W']
          })
          node = draft.get(id)
        }

        let sign = tool === 'stone_1' ? 1 : -1
        let oldSign = board.get(vertex)
        let properties = ['AW', 'AE', 'AB']
        let point = sgf.stringifyVertex(vertex)

        for (let prop of properties) {
          if (node.data[prop] == null) continue

          // Resolve compressed lists

          if (node.data[prop].some(x => x.includes(':'))) {
            draft.updateProperty(
              node.id,
              prop,
              node.data[prop]
                .map(value =>
                  sgf.parseCompressedVertices(value).map(sgf.stringifyVertex)
                )
                .reduce((list, x) => [...list, x])
            )
          }

          // Remove residue

          draft.removeFromProperty(node.id, prop, point)
        }

        let prop = oldSign !== sign ? properties[sign + 1] : 'AE'
        draft.addToProperty(node.id, prop, point)
      } else if (['line', 'arrow'].includes(tool)) {
        let endVertex = argument
        if (!endVertex || helper.vertexEquals(vertex, endVertex)) return

        // Check whether to remove a line

        let toDelete = board.lines.findIndex(x =>
          helper.equals([x.v1, x.v2], [vertex, endVertex])
        )

        if (toDelete === -1) {
          toDelete = board.lines.findIndex(x =>
            helper.equals([x.v1, x.v2], [endVertex, vertex])
          )

          if (
            toDelete >= 0 &&
            tool !== 'line' &&
            board.lines[toDelete].type === 'arrow'
          ) {
            // Do not delete after all
            toDelete = -1
          }
        }

        // Mutate board first, then apply changes to actual game tree

        if (toDelete >= 0) {
          board.lines.splice(toDelete, 1)
        } else {
          board.lines.push({v1: vertex, v2: endVertex, type: tool})
        }

        draft.removeProperty(node.id, 'AR')
        draft.removeProperty(node.id, 'LN')

        for (let {v1, v2, type} of board.lines) {
          let [p1, p2] = [v1, v2].map(sgf.stringifyVertex)
          if (p1 === p2) continue

          draft.addToProperty(
            node.id,
            type === 'arrow' ? 'AR' : 'LN',
            [p1, p2].join(':')
          )
        }
      } else {
        // Mutate board first, then apply changes to actual game tree

        let [x, y] = vertex

        if (tool === 'number') {
          if (
            board.markers[y][x] != null &&
            board.markers[y][x].type === 'label'
          ) {
            board.markers[y][x] = null
          } else {
            let number =
              node.data.LB == null
                ? 1
                : node.data.LB.map(x => parseFloat(x.slice(3)))
                    .filter(x => !isNaN(x))
                    .sort((a, b) => a - b)
                    .filter((x, i, arr) => i === 0 || x !== arr[i - 1])
                    .concat([null])
                    .findIndex((x, i) => i + 1 !== x) + 1

            argument = number.toString()
            board.markers[y][x] = {type: tool, label: number.toString()}
          }
        } else if (tool === 'label') {
          let label = argument

          if (
            (label != null && label.trim() === '') ||
            (label == null &&
              board.markers[y][x] != null &&
              board.markers[y][x].type === 'label')
          ) {
            board.markers[y][x] = null
          } else {
            if (label == null) {
              let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
              let letterIndex = Math.max(
                node.data.LB == null
                  ? 0
                  : node.data.LB.filter(x => x.length === 4)
                      .map(x => alpha.indexOf(x[3]))
                      .filter(x => x >= 0)
                      .sort((a, b) => a - b)
                      .filter((x, i, arr) => i === 0 || x !== arr[i - 1])
                      .concat([null])
                      .findIndex((x, i) => i !== x),
                node.data.L == null ? 0 : node.data.L.length
              )

              label = alpha[Math.min(letterIndex, alpha.length - 1)]
              argument = label
            }

            board.markers[y][x] = {type: tool, label}
          }
        } else {
          if (
            board.markers[y][x] != null &&
            board.markers[y][x].type === tool
          ) {
            board.markers[y][x] = null
          } else {
            board.markers[y][x] = {type: tool}
          }
        }

        draft.removeProperty(node.id, 'L')
        for (let id in data) draft.removeProperty(node.id, data[id])

        // Now apply changes to game tree

        for (let x = 0; x < board.width; x++) {
          for (let y = 0; y < board.height; y++) {
            let v = [x, y]
            if (board.markers[y][x] == null) continue

            let prop = data[board.markers[y][x].type]
            let value = sgf.stringifyVertex(v)
            if (prop === 'LB') value += ':' + board.markers[y][x].label

            draft.addToProperty(node.id, prop, value)
          }
        }
      }
    })

    this.setCurrentTreePosition(newTree, node.id)

    this.events.emit('toolUse', {tool, vertex, argument})
  }

  // Navigation

  setCurrentTreePosition(tree, treePosition, {clearCache = false} = {}) {
    if (clearCache) gametree.clearBoardCache()

    let navigated = treePosition !== this.state.treePosition

    if (['scoring', 'estimator'].includes(this.state.mode) && navigated) {
      this.setState({mode: 'play'})
    }

    let {gameTrees, gameCurrents, blockedGuesses} = this.state
    let gameIndex = gameTrees.findIndex(t => t.root.id === tree.root.id)
    let currents = gameCurrents[gameIndex]

    let n = tree.get(treePosition)
    while (n.parentId != null) {
      // Update currents

      currents[n.parentId] = n.id
      n = tree.get(n.parentId)
    }

    let prevGameIndex = this.state.gameIndex
    let prevTreePosition = this.state.treePosition

    this.setState({
      playVariation: null,
      blockedGuesses: navigated ? [] : blockedGuesses,
      gameTrees: gameTrees.map((t, i) => (i !== gameIndex ? t : tree)),
      gameIndex,
      treePosition
    })

    this.recordHistory({prevGameIndex, prevTreePosition})

    if (navigated) this.events.emit('navigate')

    // Continuous analysis

    let syncer = this.inferredState.analyzingEngineSyncer

    if (
      syncer != null &&
      navigated &&
      (this.state.engineGameOngoing == null ||
        ![
          this.state.blackEngineSyncerId,
          this.state.whiteEngineSyncerId
        ].includes(this.state.analyzingEngineSyncerId))
    ) {
      clearTimeout(this.continuousAnalysisId)

      this.continuousAnalysisId = setTimeout(() => {
        this.analyzeMove(treePosition)
      }, setting.get('game.navigation_analysis_delay'))
    }
  }

  /**
   * 前进后退：
      前进： goStep(1)
      后退： goStep(-1)
   */
  goStep(step) {
    let {gameTrees, gameIndex, gameCurrents, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let node = tree.navigate(treePosition, step, gameCurrents[gameIndex])
    if (node != null) this.setCurrentTreePosition(tree, node.id)
  }

  goToMoveNumber(number) {
    number = +number

    if (isNaN(number)) return
    if (number < 0) number = 0

    let {gameTrees, gameIndex, gameCurrents} = this.state
    let tree = gameTrees[gameIndex]
    let node = tree.navigate(
      tree.root.id,
      Math.round(number),
      gameCurrents[gameIndex]
    )

    if (node != null) this.setCurrentTreePosition(tree, node.id)
    else this.goToEnd()
  }

  goToNextFork() {
    let {gameTrees, gameIndex, gameCurrents, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let next = tree.navigate(treePosition, 1, gameCurrents[gameIndex])
    if (next == null) return
    let sequence = [...tree.getSequence(next.id)]

    this.setCurrentTreePosition(tree, sequence.slice(-1)[0].id)
  }

  goToPreviousFork() {
    let {gameTrees, gameIndex, gameCurrents, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let node = tree.get(treePosition)
    let prev = tree.get(node.parentId)
    if (prev == null) return
    let newTreePosition = tree.root.id

    for (let node of tree.listNodesVertically(
      prev.id,
      -1,
      gameCurrents[gameIndex]
    )) {
      if (node.children.length > 1) {
        newTreePosition = node.id
        break
      }
    }

    this.setCurrentTreePosition(tree, newTreePosition)
  }

  goToComment(step) {
    let {gameTrees, gameIndex, gameCurrents, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let commentProps = setting.get('sgf.comment_properties')
    let newTreePosition = null

    for (let node of tree.listNodesVertically(
      treePosition,
      step,
      gameCurrents[gameIndex]
    )) {
      if (
        node.id !== treePosition &&
        commentProps.some(prop => node.data[prop] != null)
      ) {
        newTreePosition = node.id
        break
      }
    }

    if (newTreePosition != null)
      this.setCurrentTreePosition(tree, newTreePosition)
  }

  /**
   * 跳转到开局
   */
  goToBeginning() {
    let {gameTrees, gameIndex} = this.state
    let tree = gameTrees[gameIndex]

    this.setCurrentTreePosition(tree, tree.root.id)
  }
  /**
   * 跳转到终局
   */
  goToEnd() {
    let {gameTrees, gameIndex, gameCurrents} = this.state
    let tree = gameTrees[gameIndex]
    let [node] = [...tree.listCurrentNodes(gameCurrents[gameIndex])].slice(-1)

    this.setCurrentTreePosition(tree, node.id)
  }

  goToSiblingVariation(step) {
    let {gameTrees, gameIndex, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let section = [...tree.getSection(tree.getLevel(treePosition))]
    let index = section.findIndex(node => node.id === treePosition)
    let newIndex =
      (((step + index) % section.length) + section.length) % section.length

    this.setCurrentTreePosition(tree, section[newIndex].id)
  }

  goToMainVariation() {
    let {gameTrees, gameIndex, gameCurrents, treePosition} = this.state
    let tree = gameTrees[gameIndex]

    gameCurrents[gameIndex] = {}
    this.setState({gameCurrents})

    if (tree.onMainLine(treePosition)) {
      this.setCurrentTreePosition(tree, treePosition)
    } else {
      let id = treePosition
      while (!tree.onMainLine(id)) {
        id = tree.get(id).parentId
      }

      this.setCurrentTreePosition(tree, id)
    }
  }

  goToSiblingGame(step) {
    let {gameTrees, gameIndex} = this.state
    let newIndex = Math.max(0, Math.min(gameTrees.length - 1, gameIndex + step))

    this.closeDrawer()
    this.setCurrentTreePosition(
      gameTrees[newIndex],
      gameTrees[newIndex].root.id
    )
  }

  startAutoscrolling(step) {
    if (this.autoscrollId != null) return

    let first = true
    let maxDelay = setting.get('autoscroll.max_interval')
    let minDelay = setting.get('autoscroll.min_interval')
    let diff = setting.get('autoscroll.diff')

    let scroll = (delay = null) => {
      this.goStep(step)

      clearTimeout(this.autoscrollId)
      this.autoscrollId = setTimeout(() => {
        scroll(first ? maxDelay : Math.max(minDelay, delay - diff))
        first = false
      }, delay)
    }

    scroll(400)
  }

  stopAutoscrolling() {
    clearTimeout(this.autoscrollId)
    this.autoscrollId = null
  }

  // Find Methods

  async findPosition(step, condition) {
    if (isNaN(step)) step = 1
    else step = step >= 0 ? 1 : -1

    this.setBusy(true)
    await helper.wait(setting.get('find.delay'))

    let {gameTrees, gameIndex, treePosition} = this.state
    let tree = gameTrees[gameIndex]
    let node = tree.get(treePosition)

    function* listNodes() {
      let iterator = tree.listNodesHorizontally(treePosition, step)
      iterator.next()

      yield* iterator

      let node =
        step > 0
          ? tree.root
          : [...tree.getSection(tree.getHeight() - 1)].slice(-1)[0]

      yield* tree.listNodesHorizontally(node.id, step)
    }

    for (node of listNodes()) {
      if (node.id === treePosition || condition(node)) break
    }

    this.setCurrentTreePosition(tree, node.id)
    this.setBusy(false)
  }

  async findMove(step, {vertex = null, text = ''}) {
    if (vertex == null && text.trim() === '') return
    let point = vertex ? sgf.stringifyVertex(vertex) : null

    await this.findPosition(step, node => {
      let cond = (prop, value) =>
        node.data[prop] != null &&
        node.data[prop][0].toLowerCase().includes(value.toLowerCase())

      return (
        (!point || ['B', 'W'].some(x => cond(x, point))) &&
        (!text || cond('C', text) || cond('N', text))
      )
    })
  }

  // View

  setBoardTransformation(transformation) {
    this.setState({
      boardTransformation: gobantransformer.normalize(transformation)
    })
  }

  pushBoardTransformation(transformation) {
    this.setState(({boardTransformation}) => ({
      boardTransformation: gobantransformer.normalize(
        boardTransformation + transformation
      )
    }))
  }

  // Node Actions

  getGameInfo() {
    return gametree.getGameInfo(this.inferredState.gameTree)
  }

  setGameInfo(data) {
    let newTree = gametree.setGameInfo(this.inferredState.gameTree, data)

    if (data.size) {
      setting.set('game.default_board_size', data.size.join(':'))
    }

    if (data.komi && data.komi.toString() !== '') {
      setting.set('game.default_komi', isNaN(data.komi) ? 0 : +data.komi)
    }

    if (data.handicap && data.handicap.toString() !== '') {
      setting.set(
        'game.default_handicap',
        isNaN(data.handicap) ? 0 : +data.handicap
      )
    }

    this.setCurrentTreePosition(newTree, this.state.treePosition)
  }

  getPlayer(treePosition) {
    let node = this.inferredState.gameTree.get(treePosition)
    if(!node){
      return
    }
    let data = node.data

    return data.PL != null
      ? data.PL[0] === 'W'
        ? -1
        : 1
      : data.B != null || (data.HA != null && +data.HA[0] >= 1)
      ? -1
      : 1
  }

  setPlayer(treePosition, sign) {
    let newTree = this.inferredState.gameTree.mutate(draft => {
      let node = draft.get(treePosition)
      let intendedSign =
        node.data.B != null || (node.data.HA != null && +node.data.HA[0] >= 1)
          ? -1
          : +(node.data.W != null)

      if (intendedSign === sign || sign === 0) {
        draft.removeProperty(treePosition, 'PL')
      } else {
        draft.updateProperty(treePosition, 'PL', [sign > 0 ? 'B' : 'W'])
      }
    })

    this.setCurrentTreePosition(newTree, treePosition)
  }

  getComment(treePosition) {
    let {data} = this.inferredState.gameTree.get(treePosition)

    return {
      title: data.N != null ? data.N[0].trim() : null,
      comment: data.C != null ? data.C[0] : null,
      hotspot: data.HO != null,
      moveAnnotation:
        data.BM != null
          ? 'BM'
          : data.TE != null
          ? 'TE'
          : data.DO != null
          ? 'DO'
          : data.IT != null
          ? 'IT'
          : null,
      positionAnnotation:
        data.UC != null
          ? 'UC'
          : data.GW != null
          ? 'GW'
          : data.DM != null
          ? 'DM'
          : data.GB != null
          ? 'GB'
          : null
    }
  }


  copyVariation(treePosition) {
    let node = this.inferredState.gameTree.get(treePosition)
    let copy = {
      id: node.id,
      data: Object.assign({}, node.data),
      parentId: null,
      children: node.children
    }

    let stripProperties = setting.get('edit.copy_variation_strip_props')

    for (let prop of stripProperties) {
      delete copy.data[prop]
    }

    this.copyVariationData = copy
  }

  cutVariation(treePosition) {
    this.copyVariation(treePosition)
    this.removeNode(treePosition, {suppressConfirmation: true})
  }

  pasteVariation(treePosition) {
    if (this.copyVariationData == null) return

    this.closeDrawer()
    this.setMode('play')

    let newPosition
    let copied = this.copyVariationData
    let newTree = this.inferredState.gameTree.mutate(draft => {
      let inner = (id, children) => {
        let childIds = []

        for (let child of children) {
          let childId = draft.appendNode(id, child.data)
          childIds.push(childId)

          inner(childId, child.children)
        }

        return childIds
      }

      newPosition = inner(treePosition, [copied])[0]
    })

    this.setCurrentTreePosition(newTree, newPosition)
  }

  flattenVariation(treePosition) {
    this.closeDrawer()
    this.setMode('play')

    let {gameTrees} = this.state
    let {gameTree: tree} = this.inferredState
    let gameIndex = gameTrees.findIndex(t => t.root.id === tree.root.id)
    if (gameIndex < 0) return

    let board = gametree.getBoard(tree, treePosition)
    let playerSign = this.getPlayer(treePosition)
    let inherit = setting.get('edit.flatten_inherit_root_props')

    let newTree = tree.mutate(draft => {
      draft.makeRoot(treePosition)

      for (let prop of ['AB', 'AW', 'AE', 'B', 'W']) {
        draft.removeProperty(treePosition, prop)
      }

      for (let prop of inherit) {
        draft.updateProperty(treePosition, prop, tree.root.data[prop])
      }

      for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          let sign = board.get([x, y])
          if (sign == 0) continue

          draft.addToProperty(
            treePosition,
            sign > 0 ? 'AB' : 'AW',
            sgf.stringifyVertex([x, y])
          )
        }
      }
    })

    this.setState({
      gameTrees: gameTrees.map((t, i) => (i === gameIndex ? newTree : t))
    })
    this.setCurrentTreePosition(newTree, newTree.root.id)
    this.setPlayer(treePosition, playerSign)
  }

  makeMainVariation(treePosition) {
    this.closeDrawer()
    this.setMode('play')

    let {gameCurrents, gameTrees} = this.state
    let {gameTree: tree} = this.inferredState
    let gameIndex = gameTrees.findIndex(t => t.root.id === tree.root.id)
    if (gameIndex < 0) return

    let newTree = tree.mutate(draft => {
      let id = treePosition

      while (id != null) {
        draft.shiftNode(id, 'main')
        id = draft.get(id).parentId
      }
    })

    gameCurrents[gameIndex] = {}
    this.setState({gameCurrents})
    this.setCurrentTreePosition(newTree, treePosition)
  }

  shiftVariation(treePosition, step) {
    this.closeDrawer()
    this.setMode('play')

    let shiftNode = null
    let {gameTree: tree} = this.inferredState

    for (let node of tree.listNodesVertically(treePosition, -1, {})) {
      let parent = tree.get(node.parentId)

      if (parent.children.length >= 2) {
        shiftNode = node
        break
      }
    }

    if (shiftNode == null) return

    let newTree = tree.mutate(draft => {
      draft.shiftNode(shiftNode.id, step >= 0 ? 'right' : 'left')
    })

    this.setCurrentTreePosition(newTree, treePosition)
  }

  removeNode(treePosition, {suppressConfirmation = false} = {}) {
    let t = i18n.context('sabaki.node')
    let {gameTree: tree} = this.inferredState
    let node = tree.get(treePosition)
    let noParent = node.parentId == null

    // if (
    //   suppressConfirmation !== true &&
    //   setting.get('edit.show_removenode_warning') &&
    //   dialog.showMessageBox(
    //     t('Do you really want to remove this node?'),
    //     'warning',
    //     [t('Remove Node'), t('Cancel')],
    //     1
    //   ) === 1
    // )
    //   return

    this.closeDrawer()
    this.setMode('play')

    // Remove node

    let newTree = tree.mutate(draft => {
      if (!noParent) {
        draft.removeNode(treePosition)
      } else {
        for (let child of node.children) {
          draft.removeNode(child.id)
        }

        for (let prop of ['AB', 'AW', 'AE', 'B', 'W']) {
          draft.removeProperty(node.id, prop)
        }
      }
    })

    this.setState(({gameCurrents, gameIndex}) => {
      if (!noParent) {
        if (gameCurrents[gameIndex][node.parentId] === node.id) {
          delete gameCurrents[gameIndex][node.parentId]
        }
      } else {
        delete gameCurrents[gameIndex][node.id]
      }

      return {gameCurrents}
    })

    this.setCurrentTreePosition(newTree, noParent ? node.id : node.parentId)
  }

  removeOtherVariations(treePosition, {suppressConfirmation = false} = {}) {
    let t = i18n.context('sabaki.node')

    // if (
    //   suppressConfirmation !== true &&
    //   setting.get('edit.show_removeothervariations_warning') &&
    //   dialog.showMessageBox(
    //     t('Do you really want to remove all other variations?'),
    //     'warning',
    //     [t('Remove Variations'), t('Cancel')],
    //     1
    //   ) == 1
    // )
    //   return

    this.closeDrawer()
    this.setMode('play')

    let {gameCurrents, gameTrees} = this.state
    let {gameTree: tree} = this.inferredState
    let gameIndex = gameTrees.findIndex(t => t.root.id === tree.root.id)
    if (gameIndex < 0) return

    let newTree = tree.mutate(draft => {
      // Remove all subsequent variations

      for (let node of tree.listNodesVertically(
        treePosition,
        1,
        gameCurrents[gameIndex]
      )) {
        if (node.children.length <= 1) continue

        let next = tree.navigate(node.id, 1, gameCurrents[gameIndex])

        for (let child of node.children) {
          if (child.id === next.id) continue
          draft.removeNode(child.id)
        }
      }

      // Remove all precedent variations

      let prevId = treePosition

      for (let node of tree.listNodesVertically(treePosition, -1, {})) {
        if (node.id !== prevId && node.children.length > 1) {
          gameCurrents[gameIndex][node.id] = prevId

          for (let child of node.children) {
            if (child.id === prevId) continue
            draft.removeNode(child.id)
          }
        }

        prevId = node.id
      }
    })

    this.setState({gameCurrents})
    this.setCurrentTreePosition(newTree, treePosition)
  }

}

// 返回实例（单例）
export default new Sabaki()
