import events from 'events'
import colors from './colors.js'
import {
  yes, no, help, showMenu,
  showMenuItemById, showOrderById, showOrders,
  showUserByEmail, showUsers
} from './handlers.js'

class EventBus extends events {
  constructor() {
    super()
  }
}

const eventBus = new EventBus()

eventBus.on('exit', (_interface) => {
  console.log(colors.cyan, 'Are you sure?')
  _interface.prompt()
})

eventBus.on('yes', yes)
eventBus.on('y', yes)
eventBus.on('no', no)
eventBus.on('n', no)

eventBus.on('help', help)
eventBus.on('man', help)

eventBus.on('show', (_interface, cli, entity, category) => {
  if (entity === 'menu') {
    showMenu(_interface, cli, category)
  } else if (entity === 'orders') {
    showOrders(_interface, cli, category)
  } else if (entity === 'users') {
    showUsers(_interface, cli, category)
  } else {
    console.log('Invalid parameters. Please try again.')
  }
})

eventBus.on('details', (_interface, cli, entity, params) => {
  if (entity === 'menu-item') {
    showMenuItemById(_interface, cli, params)
  } else if (entity === 'orders') {
    showOrderById(_interface, cli, params)
  } else if (entity === 'users') {
    showUserByEmail(_interface, cli, params)
  } else {
    console.log('Invalid parameters. Please try again.')
  }
})

export { eventBus } 