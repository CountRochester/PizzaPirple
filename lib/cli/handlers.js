import commands from './commands.js'
import { lineColors } from './colors.js'
import { ServerError } from '../error.js'
import { User } from '../orm/user.js'
import { Order } from '../orm/order.js'
import helpers from '../helpers.js'
import _data from '../data.js'
import colors from './colors.js'

const LEFT_PADDING = 5
const LEFT_COLUMN_WIDTH = 15
const MIDDLE_COLUMN_WIDTH = 25

function drawInConsole (items, caption, cli) {
  if (Object.prototype.toString.call(items) !== '[object Array]') {
    items = [items]
  }

  cli.addVerticalSpace()
  cli.horizontalLine('=')
  cli.centered(caption)
  cli.horizontalLine()
  cli.addVerticalSpace()

  items.forEach((item) => {
    if (item.getData) {
      console.log(item.getData())
    } else {
      console.log(item)
    }
  })

  cli.addVerticalSpace()
  cli.horizontalLine()
  cli.addVerticalSpace()
}

function fillSpace (width) {
  let line = ''
  for (let i = 0; i < width; i++) {
    line += ' '
  }
  return line
}

function fill (width, str, startX) {
  const isString = typeof str === 'string'
  str = isString && str.trim().length > 0 ? str.trim() : ''

  const isNumber = typeof width === 'number'
  width = isNumber && width ? width : str.length

  startX = typeof startX === 'number' ? startX : 0

  if (str.length <= width) {
    const space = fillSpace(width - str.length)
    const output = str + space
    return [output]
  } else {
    const linesNumber = Math.ceil(str.length / width)
    const output = []
    for (let i = 0; i < linesNumber; i++) {
      let line = ''
      if (i) {
        line += fillSpace(startX)
      }
      const start = i * width
      const end = start + width
      if (end > str.length) {
        line += str.slice(start, str.length)
        const spaceLeft = (i + 1) * width - str.length
        line += fillSpace(spaceLeft)
      } else {
        line += str.slice(start, end)
      }
      output.push(line)
    }
    return output
  }
}

function isInRange (val, { start, end }) {
  return val >= start && val <= end
}

function getRange () {
  return {
    '24h': helpers.get24h(),
    today: helpers.getToday(),
    week: helpers.getWeek(),
    month: helpers.getMonth(),
    year: helpers.getYear()
  }
}

export const yes = (_interface) => {
  if (_interface.history.includes('exit')) {
    console.log(colors.cyan, 'Goodbye')
    process.exit(0)
  }
}

export const no = (_interface) => {
  _interface.history = []
}

export const help = (_interface, cli) => {
  cli.addVerticalSpace()
  cli.horizontalLine('=')
  cli.centered('Help page')
  cli.horizontalLine()
  cli.addVerticalSpace()
  const screedWidth = process.stdout.columns
  for (const command of commands) {
    cli.horizontalLine()
    const params = command.args
      .map(el => `<${el}>`)
      .join(', ')
    const thirdColumnWidth = screedWidth - LEFT_PADDING - LEFT_COLUMN_WIDTH - MIDDLE_COLUMN_WIDTH

    const firstColumn = fill(LEFT_COLUMN_WIDTH, `${command.command}`)
    const secondColumn = fill(MIDDLE_COLUMN_WIDTH, `${params}`)
    const thirdColumn = fill(thirdColumnWidth, `${command.description}`)


    let i = 0
    while (i < thirdColumn.length) {
      let line = fillSpace(LEFT_PADDING)

      line += lineColors.yellow
      line += firstColumn[i] || fillSpace(LEFT_COLUMN_WIDTH)
      line += lineColors.cyan
      line += secondColumn[i] || fillSpace(MIDDLE_COLUMN_WIDTH)
      line += lineColors.white
      line += thirdColumn[i]

      console.log(line)
      i++
    }
  }
  cli.addVerticalSpace()
  cli.horizontalLine('=')
  cli.addVerticalSpace()
}

export const showMenu = async (_interface, cli, category) => {
  try {
    const menu = await _data.read('', 'menu')
    if (!menu) {
      throw new ServerError(404, 'Unable to read menu', 'json')
    }

    category = ['mains', 'starters', 'desserts', 'drinks'].includes(category) ? category : false
    let items = []
    let caption = ''

    if (!category) {
      caption = 'All menu'
      items = menu.items
    } else {
      caption = category[0].toUpperCase() + category.slice(1)
      items = menu.items.filter(item => item.category === category)
    }

    drawInConsole(items, caption, cli)

  } catch (err) {
    console.log(err)
  }
}

export const showOrders = async (_interface, cli, category) => {
  try {
    const orders = await Order.findAll()
    if (!orders.length) {
      console.log('There is no orders at all')
      return
    }

    category = ['24h', 'today', 'week', 'month', 'year'].includes(category) ? category : false
    let output = []
    const range = getRange()

    let caption = ''

    if (!category) {
      output = orders
      caption = 'All orders'
    } else {
      output = orders.filter(order => isInRange(order.date, range[category]))
      caption = 'Orders in ' + category
    }

    drawInConsole(output, caption, cli)

  } catch (err) {
    console.log(err)
  }
}

export const showUsers = async (_interface, cli, category) => {
  try {
    const users = await User.findAll()
    if (!users) {
      throw new ServerError(404, 'Unable to find any users', 'json')
    }

    category = ['24h', 'today', 'week', 'month', 'year'].includes(category) ? category : false
    const range = getRange()

    let items = []
    let caption = ''
    if (!category) {
      caption = 'All users'
      items = users
    } else {
      caption = 'Users in ' + category
      items = users.filter(user => isInRange(user.lastTimeLogged, range[category]))
    }

    drawInConsole(items, caption, cli)
  } catch (err) {
    console.log(err)
  }
}

export const showUserByEmail = async (_interface, cli, email) => {
  try {
    const isString = typeof email === 'string'
    email = isString && email.trim().length > 0 ? email.trim() : false
    if (!email) {
      console.log('No user email entered')
      return
    }

    const user = await User.findOne(email)
    if (!user) {
      console.log('No users found')
      return
    }

    const caption = 'User ' + email
    drawInConsole(user, caption, cli)
  } catch (err) {
    console.log(err)
  }
}

export const showOrderById = async (_interface, cli, id) => {
  try {
    const isString = typeof id === 'string'
    id = isString && id.trim().length > 0 ? id.trim() : false
    if (!id) {
      console.log('No order id entered')
      return
    }

    const order = await Order.findOne(id)
    if (!order) {
      console.log('No orders found')
      return
    }

    const caption = 'Order details'
    drawInConsole(order, caption, cli)
  } catch (err) {
    console.log(err)
  }
}

export const showMenuItemById = async (_interface, cli, id) => {
  try {
    const isString = typeof id === 'string'
    id = isString && id.trim().length > 0 ? id.trim() : false
    if (!id) {
      console.log('No menu item entered')
      return
    }

    const menu = await _data.read('', 'menu')
    if (!menu) {
      throw new ServerError(404, 'Unable to read menu', 'json')
    }

    const menuItem = menu.items.find(el => el.id === id)
    if (!menuItem) {
      console.log('No menu item found')
      return
    }

    const caption = menuItem.name
    drawInConsole(menuItem, caption, cli)
  } catch (err) {
    console.log(err)
  }
}
