const EventEmitter = require('events')

let settings = {}

let themesDict = null

let defaults = {
  'app.always_show_result': false,
  'app.enable_hardware_acceleration': true,
  'app.hide_busy_delay': 200,
  'app.lang': 'zh-Hans', //en 
  'app.loadgame_delay': 100,
  'app.startup_check_updates': true,
  'app.startup_check_updates_delay': 3000,
  'app.zoom_factor': 1,
  'autoplay.max_sec_per_move': 99,
  'autoplay.sec_per_move': 1,
  'autoscroll.delay': 400,
  'autoscroll.diff': 10,
  'autoscroll.max_interval': 200,
  'autoscroll.min_interval': 50,
  'board.analysis_interval': 50,
  'board.analysis_type': 'winrate',
  'board.show_analysis': true,
  'board.variation_replay_mode': 'move_by_move',
  'board.variation_replay_interval': 500,
  'cleanmarkup.annotations': false,
  'cleanmarkup.arrow': true,
  'cleanmarkup.circle': true,
  'cleanmarkup.comments': false,
  'cleanmarkup.cross': true,
  'cleanmarkup.hotspots': false,
  'cleanmarkup.label': true,
  'cleanmarkup.line': true,
  'cleanmarkup.square': true,
  'cleanmarkup.triangle': true,
  'cleanmarkup.winrate': false,
  'comments.show_move_interpretation': true,
  'comments.commit_delay': 500,
  'console.max_history_count': 1000,
  'debug.dev_tools': false,
  'edit.click_currentvertex_to_remove': true,
  'edit.copy_variation_strip_props': [
    'AP',
    'CA',
    'FF',
    'GM',
    'ST',
    'SZ',
    'KM',
    'HA',
    'AN',
    'BR',
    'BT',
    'CP',
    'DT',
    'EV',
    'GN',
    'GC',
    'ON',
    'OT',
    'PB',
    'PC',
    'PW',
    'RE',
    'RO',
    'RU',
    'SO',
    'TM',
    'US',
    'WR',
    'WT'
  ],
  'edit.flatten_inherit_root_props': [
    'BR',
    'BT',
    'DT',
    'EV',
    'GN',
    'GC',
    'PB',
    'PW',
    'RE',
    'SO',
    'SZ',
    'WT',
    'WR'
  ],
  'edit.history_batch_interval': 500,
  'edit.max_history_count': 1000,
  'edit.show_removenode_warning': true,
  'edit.show_removeothervariations_warning': true,
  'engines.list': [],
  'engines.analyze_commands': ['analyze', 'kata-analyze', 'lz-analyze'],
  'engines.gemove_analyze_commands': [
    'genmove_analyze',
    'kata-genmove_analyze',
    'lz-genmove_analyze'
  ],
  'file.show_reload_warning': true,
  'find.delay': 100,
  'game.default_board_size': 19,
  'game.default_komi': 6.5,
  'game.default_handicap': 0,
  'game.goto_end_after_loading': true,
  'game.navigation_analysis_delay': 500,
  'game.navigation_sensitivity': 40,
  'game.show_ko_warning': true,
  'game.show_suicide_warning': true,
  'gamechooser.show_delay': 100,
  'gamechooser.thumbnail_size': 153,
  'graph.delay': 200,
  'graph.grid_size': 22,
  'graph.node_size': 4,
  'gtp.console_log_enabled': false,
  'gtp.console_log_path': null,
  'gtp.engine_quit_timeout': 3000,
  'gtp.move_delay': 300,
  'score.estimator_iterations': 100,
  'scoring.method': 'territory',
  'setting.overwrite.v0.19.1': ['app.startup_check_updates_delay'],
  'setting.overwrite.v0.19.3': ['graph.grid_size', 'graph.node_size'],
  'setting.overwrite.v0.30.0-beta': ['window.minheight', 'window.minwidth'],
  'setting.overwrite.v0.33.0': ['console.max_history_count'],
  'setting.overwrite.v0.33.4': ['score.estimator_iterations'],
  'setting.overwrite.v0.41.0': ['autoscroll.max_interval'],
  'setting.overwrite.v0.43.3_4': [
    'board.analysis_interval',
    'graph.delay',
    'view.winrategraph_minheight',
    'view.winrategraph_blunderthreshold',
    'view.winrategraph_height',
    'app.lang'
  ],
  'setting.overwrite.v0.50.1': [
    'engines.analyze_commands',
    'engines.gemove_analyze_commands'
  ],
  'sgf.comment_properties': [
    'C',
    'N',
    'UC',
    'GW',
    'DM',
    'GB',
    'BM',
    'TE',
    'DO',
    'IT'
  ],
  'sgf.format_code': false,
  'sound.capture_delay_max': 500,
  'sound.capture_delay_min': 300,
  'sound.enable': true,
  'theme.custom_whitestones': null,
  'theme.custom_blackstones': null,
  'theme.custom_board': null,
  'theme.custom_background': null,
  'theme.current': null,
  'view.animated_stone_placement': true,
  'view.coordinates_type': 'A1',
  'view.fuzzy_stone_placement': true,
  'view.leftsidebar_width': 250,
  'view.leftsidebar_minwidth': 100,
  'view.peerlist_height': 130,
  'view.peerlist_minheight': 58,
  'view.properties_height': 50,
  'view.properties_minheight': 20,
  'view.show_menubar': true,
  'view.show_leftsidebar': false,
  'view.show_comments': true,
  'view.show_coordinates': false,
  'view.show_graph': true,
  'view.show_move_colorization': true,
  'view.show_move_numbers': false,
  'view.show_next_moves': true,
  'view.show_siblings': true,
  'view.show_winrategraph': true,
  'view.sidebar_width': 300,
  'view.sidebar_minwidth': 100,
  'view.winrategraph_blunderthreshold': 5,
  'view.winrategraph_height': 90,
  'view.winrategraph_minheight': 30,
  'view.winrategraph_maxheight': 250,
  'view.winrategraph_invert': false,
  'infooverlay.duration': 2000,
  'window.height': 604,
  'window.minheight': 440,
  'window.minwidth': 526,
  'window.width': 564,
  'window.maximized': false
}

let eventEmitter

exports.events = {
  // 去掉id, 没有多window的情况
  on: (event, f) => {
    if (eventEmitter == null) {
      eventEmitter = new EventEmitter()
      eventEmitter.setMaxListeners(30)
    }

    eventEmitter.on(event, f)
  },
  emit: (event, evt) => {
    eventEmitter.emit(event, evt)
  }
}

exports.load = function() {
  settings = {}

  // Load default settings

  for (let key in defaults) {
    if (key in settings) continue
    settings[key] = defaults[key]
  }

  return exports
}


exports.get = function(key) {
  if (key in settings) return settings[key]
  if (key in defaults) return defaults[key]
  return null
}

exports.set = function(key, value) {
  settings[key] = value
  exports.events.emit('change', {key, value})
  return exports
}

exports.load()
