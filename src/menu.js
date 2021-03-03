// const {shell, clipboard, remote} = require('electron')
// const dialog = isRenderer ? require('./modules/dialog') : null

import sabaki from './modules/sabaki'
import i18n from './i18n.js'
const setting = require('./setting')

let menu = {}
menu.get = function(props = {}) {
  let toggleSetting = key => setting.set(key, !setting.get(key))
  let selectTool = tool => (
    sabaki.setMode('edit'), sabaki.setState({selectedTool: tool})
  )

  let {
    disableAll,
    disableGameLoading,
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
  } = props

  let data = [
    {
      id: 'file',
      label: i18n.t('menu.file', 'File'),
      submenu: [
        {
          label: i18n.t('menu.file', 'New'),
          accelerator: 'CmdOrCtrl+N',
          enabled: !disableGameLoading,
          click: () => sabaki.newFile({playSound: true, showInfo: true})
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.file', 'Open…'),
          accelerator: 'CmdOrCtrl+O',
          enabled: !disableGameLoading,
          click: () => sabaki.loadFile()
        },
        {
          label: i18n.t('menu.file', 'Save'),
          accelerator: 'CmdOrCtrl+S',
          click: () => sabaki.saveFile(sabaki.state.representedFilename)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.file', 'Game Info'),
          accelerator: 'CmdOrCtrl+I',
          click: () => sabaki.openDrawer('info')
        },
        {
          label: i18n.t('menu.file', 'Manage Games…'),
          accelerator: 'CmdOrCtrl+Shift+M',
          enabled: !disableGameLoading,
          click: () => sabaki.openDrawer('gamechooser')
        }
      ]
    },
    {
      id: 'play',
      label: i18n.t('menu.play', 'Play'),
      submenu: [
        {
          label: i18n.t('menu.play', 'Toggle Player'),
          click: () =>
            sabaki.setPlayer(
              sabaki.state.treePosition,
              -sabaki.getPlayer(sabaki.state.treePosition)
            )
        },
        {type: 'separator'},
        // {
        //   label: i18n.t('menu.play', 'Select Point'),
        //   accelerator: 'CmdOrCtrl+L',
        //   click: async () => {
        //     let value = await dialog.showInputBox(
        //       i18n.t('menu.play', 'Enter a coordinate to select a point')
        //     )
        //     if (value == null) return

        //     sabaki.clickVertex(value)
        //   }
        // },
        {
          label: i18n.t('menu.play', 'Pass'),
          accelerator: 'CmdOrCtrl+P',
          click: () => sabaki.makeMove([-1, -1])
        },
        {
          label: i18n.t('menu.play', 'Resign'),
          click: () => sabaki.makeResign()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.play', 'Estimate'),
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () =>
            sabaki.setMode(
              sabaki.state.mode === 'estimator' ? 'play' : 'estimator'
            )
        },
        {
          label: i18n.t('menu.play', 'Score'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'scoring' ? 'play' : 'scoring')
        }
      ]
    },
    {
      id: 'edit',
      label: i18n.t('menu.edit', 'Edit'),
      submenu: [
        {
          label: i18n.t('menu.edit', 'Undo'),
          accelerator: 'CmdOrCtrl+Z',
          click: () => sabaki.undo()
        },
        {
          label: i18n.t('menu.edit', 'Redo'),
          accelerator:
            process.platform === 'win32' ? 'CmdOrCtrl+Y' : 'CmdOrCtrl+Shift+Z',
          click: () => sabaki.redo()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', 'Toggle Edit Mode'),
          accelerator: 'CmdOrCtrl+E',
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'edit' ? 'play' : 'edit')
        },
        {
          label: i18n.t('menu.edit', 'Select Tool'),
          submenu: [
            {
              label: i18n.t('menu.edit', 'Stone Tool'),
              accelerator: 'CmdOrCtrl+1',
              click: () =>
                selectTool(
                  sabaki.state.mode !== 'edit' ||
                    sabaki.state.selectedTool !== 'stone_1'
                    ? 'stone_1'
                    : 'stone_-1'
                )
            },
            {
              label: i18n.t('menu.edit', 'Cross Tool'),
              accelerator: 'CmdOrCtrl+2',
              click: () => selectTool('cross')
            },
            {
              label: i18n.t('menu.edit', 'Triangle Tool'),
              accelerator: 'CmdOrCtrl+3',
              click: () => selectTool('triangle')
            },
            {
              label: i18n.t('menu.edit', 'Square Tool'),
              accelerator: 'CmdOrCtrl+4',
              click: () => selectTool('square')
            },
            {
              label: i18n.t('menu.edit', 'Circle Tool'),
              accelerator: 'CmdOrCtrl+5',
              click: () => selectTool('circle')
            },
            {
              label: i18n.t('menu.edit', 'Line Tool'),
              accelerator: 'CmdOrCtrl+6',
              click: () => selectTool('line')
            },
            {
              label: i18n.t('menu.edit', 'Arrow Tool'),
              accelerator: 'CmdOrCtrl+7',
              click: () => selectTool('arrow')
            },
            {
              label: i18n.t('menu.edit', 'Label Tool'),
              accelerator: 'CmdOrCtrl+8',
              click: () => selectTool('label')
            },
            {
              label: i18n.t('menu.edit', 'Number Tool'),
              accelerator: 'CmdOrCtrl+9',
              click: () => selectTool('number')
            }
          ]
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', 'Copy Variation'),
          click: () => sabaki.copyVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Cut Variation'),
          click: () => sabaki.cutVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Paste Variation'),
          click: () => sabaki.pasteVariation(sabaki.state.treePosition)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', 'Make Main Variation'),
          click: () => sabaki.makeMainVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Shift Left'),
          click: () => sabaki.shiftVariation(sabaki.state.treePosition, -1)
        },
        {
          label: i18n.t('menu.edit', 'Shift Right'),
          click: () => sabaki.shiftVariation(sabaki.state.treePosition, 1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', 'Flatten'),
          click: () => sabaki.flattenVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Remove Node'),
          accelerator:
            process.platform === 'darwin'
              ? 'CmdOrCtrl+Backspace'
              : 'CmdOrCtrl+Delete',
          click: () => sabaki.removeNode(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Remove Other Variations'),
          click: () => sabaki.removeOtherVariations(sabaki.state.treePosition)
        }
      ]
    },
    {
      id: 'find',
      label: i18n.t('menu.find', 'Find'),
      submenu: [
        {
          label: i18n.t('menu.find', 'Toggle Find Mode'),
          accelerator: 'CmdOrCtrl+F',
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'find' ? 'play' : 'find')
        },
        {
          label: i18n.t('menu.find', 'Find Next'),
          accelerator: 'F3',
          click: () => {
            sabaki.setMode('find')
            sabaki.findMove(1, {
              vertex: sabaki.state.findVertex,
              text: sabaki.state.findText
            })
          }
        },
        {
          label: i18n.t('menu.find', 'Find Previous'),
          accelerator: 'Shift+F3',
          click: () => {
            sabaki.setMode('find')
            sabaki.findMove(-1, {
              vertex: sabaki.state.findVertex,
              text: sabaki.state.findText
            })
          }
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.find', 'Toggle Hotspot'),
          accelerator: 'CmdOrCtrl+B',
          click: () =>
            sabaki.setComment(sabaki.state.treePosition, {
              hotspot:
                sabaki.inferredState.gameTree.get(sabaki.state.treePosition)
                  .data.HO == null
            })
        },
        {
          label: i18n.t('menu.find', 'Jump to Next Hotspot'),
          accelerator: 'F2',
          click: () => sabaki.findHotspot(1)
        },
        {
          label: i18n.t('menu.find', 'Jump to Previous Hotspot'),
          accelerator: 'Shift+F2',
          click: () => sabaki.findHotspot(-1)
        }
      ]
    },
    {
      id: 'navigation',
      label: i18n.t('menu.navigation', 'Navigation'),
      submenu: [
        {
          label: i18n.t('menu.navigation', 'Back'),
          accelerator: 'Up',
          click: () => sabaki.goStep(-1)
        },
        {
          label: i18n.t('menu.navigation', 'Forward'),
          accelerator: 'Down',
          click: () => sabaki.goStep(1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Previous Fork'),
          accelerator: 'CmdOrCtrl+Up',
          click: () => sabaki.goToPreviousFork()
        },
        {
          label: i18n.t('menu.navigation', 'Go to Next Fork'),
          accelerator: 'CmdOrCtrl+Down',
          click: () => sabaki.goToNextFork()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Previous Comment'),
          accelerator: 'CmdOrCtrl+Shift+Up',
          click: () => sabaki.goToComment(-1)
        },
        {
          label: i18n.t('menu.navigation', 'Go to Next Comment'),
          accelerator: 'CmdOrCtrl+Shift+Down',
          click: () => sabaki.goToComment(1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Beginning'),
          accelerator: 'Home',
          click: () => sabaki.goToBeginning()
        },
        {
          label: i18n.t('menu.navigation', 'Go to End'),
          accelerator: 'End',
          click: () => sabaki.goToEnd()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Main Variation'),
          accelerator: 'CmdOrCtrl+Left',
          click: () => sabaki.goToMainVariation()
        },
        {
          label: i18n.t('menu.navigation', 'Go to Previous Variation'),
          accelerator: 'Left',
          click: () => sabaki.goToSiblingVariation(-1)
        },
        {
          label: i18n.t('menu.navigation', 'Go to Next Variation'),
          accelerator: 'Right',
          click: () => sabaki.goToSiblingVariation(1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Move Number'),
          accelerator: 'CmdOrCtrl+G',
          click: async () => {
            // let value = await dialog.showInputBox(
            //   i18n.t('menu.navigation', 'Enter a move number to go to')
            // )
            // if (value == null) return

            // sabaki.closeDrawer()
            // sabaki.goToMoveNumber(value)
          }
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Next Game'),
          accelerator: 'CmdOrCtrl+PageDown',
          click: () => sabaki.goToSiblingGame(1)
        },
        {
          label: i18n.t('menu.navigation', 'Go to Previous Game'),
          accelerator: 'CmdOrCtrl+PageUp',
          click: () => sabaki.goToSiblingGame(-1)
        }
      ]
    },
    {
      id: 'tools',
      label: i18n.t('menu.tools', 'Tools'),
      submenu: [
        {
          label: i18n.t('menu.tools', 'Toggle Autoplay Mode'),
          click: () =>
            sabaki.setMode(
              sabaki.state.mode === 'autoplay' ? 'play' : 'autoplay'
            )
        },
        {
          label: i18n.t('menu.tools', 'Toggle Guess Mode'),
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'guess' ? 'play' : 'guess')
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.tools', 'Clean Markup…'),
          click: () => sabaki.openDrawer('cleanmarkup')
        },
        {
          label: i18n.t('menu.tools', 'Edit SGF Properties…'),
          click: () => sabaki.openDrawer('advancedproperties')
        }
      ]
    },
    {
      id: 'view',
      label: i18n.t('menu.view', 'View'),
      submenu: [
        {
          label: i18n.t('menu.view', 'Toggle Full Screen'),
          accelerator:
            process.platform === 'darwin' ? 'CmdOrCtrl+Shift+F' : 'F11',
          click: () =>
            sabaki.setState(({fullScreen}) => ({fullScreen: !fullScreen}))
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.view', 'Show Coordinates'),
          submenu: [
            {
              label: i18n.t('menu.view', 'Don’t Show'),
              accelerator: 'CmdOrCtrl+Shift+C',
              type: 'checkbox',
              checked: !showCoordinates,
              click: () => toggleSetting('view.show_coordinates')
            },
            {type: 'separator'},
            {
              label: i18n.t('menu.view', 'A1 (Default)'),
              type: 'checkbox',
              checked: !!showCoordinates && coordinatesType === 'A1',
              click: () => {
                setting.set('view.show_coordinates', true)
                setting.set('view.coordinates_type', 'A1')
              }
            },
            {
              label: i18n.t('menu.view', '1-1'),
              type: 'checkbox',
              checked: !!showCoordinates && coordinatesType === '1-1',
              click: () => {
                setting.set('view.show_coordinates', true)
                setting.set('view.coordinates_type', '1-1')
              }
            },
            {
              label: i18n.t('menu.view', 'Relative'),
              type: 'checkbox',
              checked: !!showCoordinates && coordinatesType === 'relative',
              click: () => {
                setting.set('view.show_coordinates', true)
                setting.set('view.coordinates_type', 'relative')
              }
            }
          ]
        },
        {
          label: i18n.t('menu.view', 'Show Move Numbers'),
          type: 'checkbox',
          checked: !!showMoveNumbers,
          click: () => toggleSetting('view.show_move_numbers')
        },
        {
          label: i18n.t('menu.view', 'Show Move Colorization'),
          type: 'checkbox',
          checked: !!showMoveColorization,
          click: () => toggleSetting('view.show_move_colorization')
        },
        {
          label: i18n.t('menu.view', 'Show Next Moves'),
          type: 'checkbox',
          checked: !!showNextMoves,
          click: () => toggleSetting('view.show_next_moves')
        },
        {
          label: i18n.t('menu.view', 'Show Sibling Variations'),
          type: 'checkbox',
          checked: !!showSiblings,
          click: () => toggleSetting('view.show_siblings')
        },
        {
          label: i18n.t('menu.view', 'Show Heatmap'),
          submenu: [
            {
              label: i18n.t('menu.view', 'Don’t Show'),
              type: 'checkbox',
              checked: !showAnalysis,
              click: () => toggleSetting('board.show_analysis')
            },
            {type: 'separator'},
            {
              label: i18n.t('menu.view', 'Show Win Rate'),
              type: 'checkbox',
              checked: !!showAnalysis && analysisType === 'winrate',
              click: () => {
                setting.set('board.show_analysis', true)
                setting.set('board.analysis_type', 'winrate')
              }
            },
            {
              label: i18n.t('menu.view', 'Show Score Lead'),
              type: 'checkbox',
              checked: !!showAnalysis && analysisType === 'scoreLead',
              click: () => {
                setting.set('board.show_analysis', true)
                setting.set('board.analysis_type', 'scoreLead')
              }
            }
          ]
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.view', 'Show Winrate Graph'),
          type: 'checkbox',
          checked: !!showWinrateGraph,
          enabled: !!showGameGraph || !!showCommentBox,
          click: () => {
            toggleSetting('view.show_winrategraph')
            sabaki.setState(({showWinrateGraph}) => ({
              showWinrateGraph: !showWinrateGraph
            }))
          }
        },
        {
          label: i18n.t('menu.view', 'Show Game Tree'),
          type: 'checkbox',
          checked: !!showGameGraph,
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            toggleSetting('view.show_graph')
            sabaki.setState(({showGameGraph}) => ({
              showGameGraph: !showGameGraph
            }))
          }
        },
        {
          label: i18n.t('menu.view', 'Show Comments'),
          type: 'checkbox',
          checked: !!showCommentBox,
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            toggleSetting('view.show_comments')
            sabaki.setState(({showCommentBox}) => ({
              showCommentBox: !showCommentBox
            }))
          }
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.view', 'Zoom'),
          submenu: [
            {
              label: i18n.t('menu.view', 'Increase'),
              accelerator: 'CmdOrCtrl+Plus',
              click: () =>
                setting.set(
                  'app.zoom_factor',
                  setting.get('app.zoom_factor') + 0.1
                )
            },
            {
              label: i18n.t('menu.view', 'Decrease'),
              accelerator: 'CmdOrCtrl+-',
              click: () =>
                setting.set(
                  'app.zoom_factor',
                  Math.max(0, setting.get('app.zoom_factor') - 0.1)
                )
            },
            {
              label: i18n.t('menu.view', 'Reset'),
              accelerator: 'CmdOrCtrl+0',
              click: () => setting.set('app.zoom_factor', 1)
            }
          ]
        },
        {
          label: i18n.t('menu.view', 'Transform Board'),
          submenu: [
            {
              label: i18n.t('menu.tools', 'Rotate Anticlockwise'),
              accelerator: 'CmdOrCtrl+Alt+Left',
              click: () => sabaki.pushBoardTransformation('rrr')
            },
            {
              label: i18n.t('menu.tools', 'Rotate Clockwise'),
              accelerator: 'CmdOrCtrl+Alt+Right',
              click: () => sabaki.pushBoardTransformation('r')
            },
            {
              label: i18n.t('menu.tools', 'Flip Horizontally'),
              accelerator: 'CmdOrCtrl+Alt+Down',
              click: () => sabaki.pushBoardTransformation('f')
            },
            {
              label: i18n.t('menu.tools', 'Flip Vertically'),
              accelerator: 'CmdOrCtrl+Alt+Shift+Down',
              click: () => sabaki.pushBoardTransformation('rrf')
            },
            {
              label: i18n.t('menu.tools', 'Invert Colors'),
              accelerator: 'CmdOrCtrl+Alt+Up',
              click: () => sabaki.pushBoardTransformation('i')
            },
            {
              label: i18n.t('menu.tools', 'Reset'),
              accelerator: 'CmdOrCtrl+Alt+0',
              click: () => sabaki.setBoardTransformation('')
            }
          ]
        }
      ]
    }
  ].filter(x => !!x)

  let findMenuItem = str => data.find(item => item.id === str)

  // Modify menu for macOS

  let processMenu = (menu, idPrefix = '') => {
    menu.forEach((item, i) => {
      // Generate id

      if (item.id == null) {
        item.id = idPrefix + i
      }

      // Handle disableAll prop

      if (
        disableAll &&
        !item.neverDisable &&
        !('submenu' in item || 'role' in item)
      ) {
        item.enabled = false
      }

      if ('submenu' in item) {
        processMenu(item.submenu, `${item.id}-`)
      }
    })

    return menu
  }

  return processMenu(data)
}

export default menu