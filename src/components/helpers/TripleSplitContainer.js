import React, {Component} from 'react'
import SplitContainer from './SplitContainer.js'

export default class TripleSplitContainer extends Component {
  constructor(props) {
    super(props)

    this.handleBeginSideContentChange = ({sideSize}) => {
      let {onChange = () => {}} = this.props

      onChange({
        beginSideSize: sideSize,
        endSideSize: this.props.endSideSize
      })
    }

    this.handleEndSideContentChange = ({sideSize}) => {
      let {onChange = () => {}} = this.props

      onChange({
        beginSideSize: this.props.beginSideSize,
        endSideSize: sideSize
      })
    }
  }

  render() {
    let {
      id,
      classNames,
      style,
      vertical,
      beginSideContent,
      mainContent,
      endSideContent,
      beginSideSize,
      endSideSize,
      splitterSize,
      onFinish
    } = this.props

    return (
      <SplitContainer
        id={id}
        className={classNames}
        style={style}
        vertical={vertical}
        splitterSize={splitterSize}
        invert={true}
        sideSize={beginSideSize}

        mainContent={
          <SplitContainer
            vertical={vertical}
            splitterSize={splitterSize}
            sideSize={endSideSize}
            mainContent={mainContent}
            sideContent={endSideContent}
            onChange={this.handleEndSideContentChange}
            onFinish={onFinish}
          />
        }

        sideContent={beginSideContent}
        onChange={this.handleBeginSideContentChange}
        onFinish={onFinish}
      />
    )
  }
}
