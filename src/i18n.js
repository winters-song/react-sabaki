const {readFileSync} = require('fs')
const {load: dolmLoad, getKey: dolmGetKey} = require('dolm')
const languages = require('@sabaki/i18n')
const setting = require('./setting')

function getKey(input, params = {}) {
  let key = dolmGetKey(input, params)
  return key.replace(/&(?=\w)/g, '')
}

const dolm = dolmLoad({}, getKey)

let appLang = setting == null ? undefined : setting.get('app.lang')

exports.getKey = getKey
exports.t = dolm.t
exports.context = dolm.context

exports.formatNumber = function(num) {
  return new Intl.NumberFormat(appLang).format(num)
}

exports.formatMonth = function(month) {
  let date = new Date()
  date.setMonth(month)
  return date.toLocaleString(appLang, {month: 'long'})
}

exports.formatWeekday = function(weekday) {
  let date = new Date(2020, 2, 1 + (weekday % 7))
  return date.toLocaleString(appLang, {weekday: 'long'})
}

exports.formatWeekdayShort = function(weekday) {
  let date = new Date(2020, 2, 1 + (weekday % 7))
  return date.toLocaleString(appLang, {weekday: 'short'})
}

function loadStrings(strings) {
  dolm.load(strings)
}

exports.loadFile = function(filename) {
  try {
    loadStrings(
      Function(`
        "use strict"

        let exports = {}
        let module = {exports}

        ;(() => (${readFileSync(filename, 'utf8')}))()

        return module.exports
      `)()
    )
  } catch (err) {
    loadStrings({})
  }
}

exports.loadLang = function(lang) {
  appLang = lang

  exports.loadFile(languages[lang].filename)
}

exports.getLanguages = function() {
  return languages
}

if (appLang != null) {
  exports.loadLang(appLang)
}
