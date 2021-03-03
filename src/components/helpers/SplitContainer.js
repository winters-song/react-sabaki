import React, {Component} from 'react'


export default class SplitContainer extends Component {
  constructor(props) {
    super(props)

    this.handleResizerMouseDown = evt => {
      if (evt.button !== 0) return
      this.resizerMouseDown = true
    }

    this.handleMouseUp = evt => {
      if (!this.resizerMouseDown) return

      let {onFinish = () => {}} = this.props

      this.resizerMouseDown = false
      onFinish()
    }

    this.handleMouseMove = evt => {
      if (!this.resizerMouseDown) return

      let {vertical, invert, procentualSplit, onChange = () => {}} = this.props
      let rect = this.element.getBoundingClientRect()

      let mousePosition = !vertical ? evt.clientX : evt.clientY
      let containerBegin = !vertical ? rect.left : rect.top
      let containerEnd = !vertical ? rect.right : rect.bottom
      let sideSize = Math.min(
        !invert ? containerEnd - mousePosition : mousePosition - containerBegin,
        containerEnd - containerBegin
      )

      if (procentualSplit) {
        sideSize = containerEnd === containerBegin ? 0 : (sideSize * 100) / (containerEnd - containerBegin)
      }

      onChange({sideSize})
    }
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp)
    document.addEventListener('mousemove', this.handleMouseMove)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
  }

  render() {
    let {
      id,
      classNames = '',
      style = {},
      vertical,
      invert,
      procentualSplit,
      mainContent,
      sideContent,
      sideSize = 200,
      splitterSize = 5
    } = this.props

    let gridTemplate = procentualSplit ? [`${100 - sideSize}%`, `${sideSize}%`] : [`calc(100% - ${sideSize}px)`, `${sideSize}px`]
    if (invert) gridTemplate.reverse()

    let gridTemplateRows = !vertical ? '100%' : gridTemplate.join(' ')
    let gridTemplateColumns = vertical ? '100%' : gridTemplate.join(' ')

    let resizer = (<div 
      className='resizer' 
      style={{
        position: 'absolute',
        width: vertical ? null : splitterSize,
        height: !vertical ? null : splitterSize,
        cursor: vertical ? 'ns-resize' : 'ew-resize',
        left: vertical ? 0 : !invert ? 0 : null,
        right: vertical ? 0 : invert ? 0 : null,
        top: !vertical ? 0 : !invert ? 0 : null,
        bottom: !vertical ? 0 : invert ? 0 : null,
        zIndex: 999
      }}
      onMouseDown={this.handleResizerMouseDown}
    ></div>)

    return (
      <div 
        ref={el => this.element = el}
        id={id}
        className={`split-container ${classNames}`}
        style={{
          ...style,
          display: 'grid',
          gridTemplate: `${gridTemplateRows} / ${gridTemplateColumns}`
        }}
      >
        {!invert && mainContent}
        <div className='side' style={{
          position: 'relative',
          display: 'grid',
          gridTemplate: '100% / 100%'
        }}>
          {sideContent}
          {resizer}
        </div>
        {invert && mainContent}
      </div>
    )
  }
}
