export default [
  {
    command: 'help',
    args: [],
    description: 'Show this help page'
  },
  {
    command: 'man',
    args: [],
    description: 'Show this help page'
  },
  {
    command: 'exit',
    args: [],
    description: 'Kill the app'
  },
  {
    command: 'show',
    args: ['entity', 'category'],
    description:
      `Show list of selected entity. Entity may be: <menu> - show all menu items or selected category: starters, main, desserts, drinks, <orders> - show all orders or selected category: 24h, today, week, month, year, <users> - show all users or selected category: 24h, today, week, month, year.`
  },
  {
    command: 'details',
    args: ['entity', 'param'],
    description:
      `Show list of selected entity. Entity may be: <menu-item> - show additional info of menu item by id, <orders> - show additional info of order by id, <users> - show additional info of user by email`
  }
]
