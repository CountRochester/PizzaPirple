import util from 'util'
import config from './config.js'
import { Token } from './orm/index.js'
const debug = util.debuglog('workers')

export default {
  async validateTokens () {
    try {
      const tokens = await Token.findAll()
      if (!tokens.length) {
        console.warn('Tokens not found')
        return
      }
    } catch (err) {
      debug(`Error validating tokens: ${err}`)
    }
  },
  async start () {
    try {
      console.log('\x1b[33m%s\x1b[0m', 'Background workers start successfull')
      await this.validateTokens()
      setInterval(this.validateTokens, config.WORKER_INTERVAL)
    } catch (err) {
      debug(`Error starting background workers: ${err}`)
    }
  }
}
