import React, {Component} from 'react'
import { Menu, Dropdown, Button } from 'antd';


// import * as dialog from '../modules/dialog'
import menu from '../menu'
// const menu = require('../menu')

export default class MainMenu extends Component {
  constructor(props) {
    super(props)

    this.menuData = menu.get()
    this.listeners = {}
  }

  componentDidMount() {

    // let handleMenuClicks = menu => {
    //   for (let item of menu) {
    //     if (item.click != null) {
    //       this.listeners[item.id] = () => {
    //         if (!this.props.showMenuBar) {
    //           this.window.setMenuBarVisibility(false)
    //         }

    //         dialog.closeInputBox()
    //         item.click()
    //       }

    //       ipcRenderer.on(`menu-click-${item.id}`, this.listeners[item.id])
    //     }

    //     if (item.submenu != null) {
    //       handleMenuClicks(item.submenu)
    //     }
    //   }
    // }

    // handleMenuClicks(this.menuData)
  }

  componentWillUnmount() {
    // this.window.removeListener('focus', this.buildMenu)

    // for (let id in this.listeners) {
    //   ipcRenderer.removeListener(`menu-click-${item.id}`, this.listeners[id])
    // }
  }

  shouldComponentUpdate(nextProps) {
    for (let key in nextProps) {
      if (nextProps[key] !== this.props[key]) return true
    }

    return false
  }

  render() {

    const onClick = ({ key }) => {
      console.info(`Click on item ${key}`);
    };

    const menu = (
      <Menu onClick={onClick}>
        <Menu.Item key="1">
          1st menu item
        </Menu.Item>
        <Menu.Item key="2">
          2nd menu item
        </Menu.Item>
        <Menu.Item key="3">
          3rd menu item
        </Menu.Item>
      </Menu>
    );


    return (
      <Dropdown overlay={menu} placement="bottomLeft" arrow>
        <Button>bottomLeft</Button>
      </Dropdown>
    )
  }
}


// function buildMenu(props = {}) {

//   let processMenu = items => {
//     return items.map(item => {
//       if ('click' in item) {
//         item.click = () => {
//           let window = BrowserWindow.getFocusedWindow()
//           if (!window) return

//           window.webContents.send(`menu-click-${item.id}`)
//         }
//       }

//       if ('clickMain' in item) {
//         let key = item.clickMain

//         item.click = () =>
//           ({
//             newWindow,
//             checkForUpdates: () => checkForUpdates({showFailDialogs: true})
//           }[key]())

//         delete item.clickMain
//       }

//       if ('submenu' in item) {
//         processMenu(item.submenu)
//       }

//       return item
//     })
//   }


//   // Create dock menu

//   let dockMenu = Menu.buildFromTemplate([
//     {
//       label: i18n.t('menu.file', 'New &Window'),
//       click: () => newWindow()
//     }
//   ])

//   if (process.platform === 'darwin') {
//     app.dock.setMenu(dockMenu)
//   }
// }
