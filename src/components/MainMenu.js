import React, {Component} from 'react'
import { Menu, Dropdown, Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';


// import * as dialog from '../modules/dialog'
import menu from '../menu'
const { SubMenu } = Menu;

export default class MainMenu extends Component {
  constructor(props) {
    super(props)

    this.listeners = {}
  }

  shouldComponentUpdate(nextProps) {
    for (let key in nextProps) {
      if (nextProps[key] !== this.props[key]) {
        return true
      }
    }

    return false
  }

  render() {
    let menuData = menu.get(this.props)
    const getMenu = (item) => {
      return (
        <>
        {item.submenu.map((menuItem, index) => {

          const icon = menuItem.checked ? <CheckOutlined /> : <span style={{width:20, display:'inline-block'}}></span>
          if(menuItem.submenu){
            return (
              <SubMenu key={index} title={menuItem.label} icon={icon} >
                {getMenu(menuItem)}
              </SubMenu>
            )
          }

          if(menuItem.type == 'separator'){
            return <Menu.Divider key={index} />
          }
          
          return (
            <Menu.Item key={menuItem.id} onClick={menuItem.click} icon={icon} >
              {menuItem.label}
            </Menu.Item>
          )
        })}
        </>
      )
    }
    return (
      <div id="menu-bar" style={{padding: '0.6em 3em'}}>
        {menuData.map(item => {

          const menu = <Menu>{getMenu(item)}</Menu>

          return (
            <Dropdown key={item.id} overlay={menu} placement="bottomLeft"  trigger={['click']}>
              <Button ghost size='large' style={{marginRight: 10}}>{item.label}</Button>
            </Dropdown>
          )
        })}
      </div>
    )
  }
}

