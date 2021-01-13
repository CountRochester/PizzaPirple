import readline from 'readline'
import { eventBus } from './event-bus.js'

import colors from './colors.js'


const cli = {
  init () {
    console.log(colors.yellow, 'The CLI is running')
    console.log(colors.white, '')

    const _interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '>'
    })

    _interface.prompt()

    _interface.on('line', (str) => {
      const parsedStr = str.split(' ')
      const args = parsedStr.slice(1)
      eventBus.emit(parsedStr[0], _interface, cli, ...args)

      _interface.prompt()
    })
  },

  addVerticalSpace (lines) {
    const isNumber = typeof lines === 'number'
    lines = isNumber && lines > 1 ? lines : 1
    for (let i = 0; i < lines; i++) {
      console.log('')
    }
  },

  horizontalLine (char) {
    const isString = typeof char === 'string'
    char = isString ? char[0] : '-'

    const width = process.stdout.columns
    let line = ''

    for (let i = 0; i < width; i++) {
      line += char
    }

    console.log(line)
  },

  centered (str) {
    const isString = typeof str === 'string'
    const width = process.stdout.columns

    str = isString && str.trim().length > 0 ? str.trim() : ''
    const leftPadding = Math.floor((width - str.length) / 2)

    let leftSpace = ''
    for (let i = 0; i < leftPadding; i++) {
      leftSpace += ' '
    }

    console.log(leftSpace + str)
  }
}

export default cli
