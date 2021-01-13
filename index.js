import server from './lib/server.js'
import workers from './lib/workers.js'
import cli from './lib/cli/index.js'

try {
  server.init()
  workers.start()
  setTimeout(cli.init, 50)
} catch (err) {
  console.error(err)
}
