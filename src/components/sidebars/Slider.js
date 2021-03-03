import React, {Component} from 'react'
import * as helper from '../../modules/helper'

const setting = require('../../setting')

export default class Slider extends Component {
  constructor(props) {
    super(props)

    this.handleSliderAreaMouseDown = evt => {
      if (evt.button !== 0) return

      this.sliderAreaMouseDown = true
      document.dispatchEvent(new MouseEvent('mousemove', evt))
    }

    this.handleButtonMouseDown = evt => {
      if (evt.button !== 0) return

      let type = evt.currentTarget.className
      let {onStartAutoscrolling = helper.noop} = this.props

      this.buttonMouseDown = type
      onStartAutoscrolling({step: type === 'prev' ? -1 : 1})
    }
  }

  componentDidMount() {
    document.addEventListener('mouseup', () => {
      this.sliderAreaMouseDown = false

      if (this.buttonMouseDown != null) {
        let type = this.buttonMouseDown
        let {onStopAutoscrolling = helper.noop} = this.props

        this.buttonMouseDown = null
        onStopAutoscrolling({step: type === 'prev' ? -1 : 1})
      }
    })

    document.addEventListener('mousemove', evt => {
      if (!this.sliderAreaMouseDown) return

      let {onChange = helper.noop} = this.props
      let {top, height} = this.slidingAreaElement.getBoundingClientRect()
      let percent = Math.min(1, Math.max(0, (evt.clientY - top) / height))

      onChange({percent})
    })
  }

  shouldComponentUpdate({showSlider}) {
    return showSlider
  }

  render() {

    let {text, percent} = this.props

    return (
      <section id='slider'>
        <a href='#' className='prev' onMouseDown={this.handleButtonMouseDown}>▲</a>
        <a href='#' className='next' onMouseDown={this.handleButtonMouseDown}>▼</a>
        <div 
          ref={el => this.slidingAreaElement = el}
          className='inner'
          onMouseDown={this.handleSliderAreaMouseDown}
        >
          <span style={{top: percent + '%'}}>{text}</span>
        </div>
      </section>        
    )
  }
}
