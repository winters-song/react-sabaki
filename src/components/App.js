
import React, {useState, useRef, useEffect} from 'react'
import sabaki from '../modules/sabaki.js'
import * as gametree from '../modules/gametree.js'
import * as helper from '../modules/helper.js'

function App() {

  let inferredState = sabaki.inferredState
  let tree = inferredState.gameTree

  debugger;

  return (
    <h1>Hello</h1>
  )
}

export default App;