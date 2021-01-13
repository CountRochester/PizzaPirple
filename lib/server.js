import https from 'https'
import fs from 'fs'
import path from 'path'
import url from 'url'
import { StringDecoder } from 'string_decoder'
import config from './config.js'
import router from './router/index.js'
import helpers from './helpers.js'
import { html } from '../public/components/common.js'

const rootPath = path.resolve('')

const serverOptions = {
  key: fs.readFileSync(path.join(rootPath, 'https/key.pem')),
  cert: fs.readFileSync(path.join(rootPath, 'https/cert.pem'))
}

const contentTypes = {
  json: {
    'Content-Type': 'application/json',
    payloadString (payload) {
      payload = typeof payload === 'object' ? payload : {}
      return JSON.stringify(payload)
    }
  },
  html: {
    'Content-Type': 'text/html',
    payloadString (payload) {
      return typeof payload === 'string' ? payload : ''
    }
  },
  favicon: {
    'Content-Type': 'image/x-icon',
    payloadString (payload) {
      return payload || ''
    }
  },
  png: {
    'Content-Type': 'image/png',
    payloadString (payload) {
      return payload || ''
    }
  },
  jpg: {
    'Content-Type': 'image/jpeg',
    payloadString (payload) {
      return payload || ''
    }
  },
  css: {
    'Content-Type': 'text/css',
    payloadString (payload) {
      return payload || ''
    }
  },
  js: {
    'Content-Type': 'text/javascript',
    payloadString (payload) {
      return payload || ''
    }
  },
  plain: {
    'Content-Type': 'text/plain',
    payloadString (payload) {
      return payload || ''
    }
  }
}

const errorPage = (err) => html`
        <html>
        
        <body>
          <h1>Sorry, there is an error</h1>
          <h2>Error code:${err.statusCode} | ${err.message}</h2>
        </body>
        
        </html>
        `

const serverHandler = (req, res) => {
  const decoder = new StringDecoder('utf-8')
  let buffer = ''
  req.on('data', (data) => { buffer += decoder.write(data) })
  req.on('end', async () => {
    buffer += decoder.end()
    const parsedUrl = url.parse(req.url, true)
    const trimmedPath = getTrimmedPath(parsedUrl)
    const chosenHandler = choseHandler(trimmedPath)
    const data = {
      trimmedPath,
      queryStringObject: parsedUrl.query,
      method: req.method.toLowerCase(),
      headers: req.headers,
      payload: helpers.parseJsonToObject(buffer)
    }
    try {
      let { statusCode = 200, payload, contentType = 'json' } = await chosenHandler(data)
      statusCode = verifyStatusCode(statusCode)

      const avalibleContentTypes = Object.keys(contentTypes)
      const chosenType = avalibleContentTypes.includes(contentType)
        ? contentType
        : 'plain'

      const payloadString = contentTypes[chosenType].payloadString(payload)
      writeHeader(res, contentTypes[chosenType]['Content-Type'], statusCode)

      logToServerConsole(req.method, statusCode, trimmedPath)

      res.end(payloadString)
    } catch (err) {
      console.log(err)
      writeHeader(res, 'html', err.statusCode)
      res.end(errorPage(err))
    }
  })
}

function choseHandler (trimmedPath) {
  return trimmedPath.includes('public')
    ? router.public
    : router[trimmedPath]
      ? router[trimmedPath]
      : router.notFound
}

function logToServerConsole (method, statusCode, trimmedPath) {
  if (statusCode === 200) {
    console.log('\x1b[32m%s\x1b[0m', `${method} /${trimmedPath} ${statusCode}`)
  } else {
    console.log('\x1b[31m%s\x1b[0m', `${method} /${trimmedPath} ${statusCode}`)
  }
}

function writeHeader (res, contentType, statusCode) {
  res.setHeader('Content-Type', contentType)
  res.writeHead(statusCode)
}

function getTrimmedPath (parsedUrl) {
  return parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
}

function verifyStatusCode (statusCode) {
  return typeof statusCode === 'number' ? statusCode : 200
}

const httpsServer = https.createServer(serverOptions, serverHandler)

export default {
  server: httpsServer,
  router,
  init () {
    httpsServer.listen(config.PORT, () => {
      const type = process.env.NODE_ENV
      console.log('\x1b[36m%s\x1b[0m', `Server started in ${type} mode`)
      console.log('\x1b[36m%s\x1b[0m', `The https server is listening on port ${config.PORT}`)
    })
  }
}
