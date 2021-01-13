import helpers from '../helpers.js'
import _data from '../data.js'
import config from '../config.js'
import util from 'util'
import { Token, User } from '../orm/index.js'
import { ServerError } from '../error.js'

const debug = util.debuglog('tokens')

export default {
  async post (data) {
    if (!data.payload) {
      throw new ServerError(400, 'Missing required fields', 'json')
    }

    const password = helpers.validateText(data.payload.password)
    const email = helpers.validateText(data.payload.email)
    if (!email || !password) {
      throw new ServerError(400, 'Missing required fields or they are invalid', 'json')
    }

    try {
      const user = await User.findOne(email)
      const hashedPassword = helpers.hash(password)
      if (!user || user.password !== hashedPassword) {
        throw new ServerError(404, `User with email ${email} not found or password is incorrect`, 'json')
      }

      const existedToken = await user.getToken()
      if (existedToken) {
        user.updateLoginTime()
        await user.save()
        return {
          statusCode: 200,
          payload: { token: existedToken.getData() }
        }
      }

      const newToken = await Token.create({ email, password })
      if (!newToken) {
        throw new ServerError(500, 'Unable to create token', 'json')
      }

      user.updateLoginTime()
      await user.save()

      return {
        statusCode: 200,
        payload: { token: newToken.getData() }
      }
    } catch (err) {
      debug('POST, data:', data)
      debug(err)
      ServerError.throw(err)
    }
  },
  async get (data) {
    if (!data.queryStringObject.id) {
      throw new ServerError(400, 'Missing id', 'json')
    }
    const id = helpers.validateText(data.queryStringObject.id)
    if (!id || !id.length) {
      throw new ServerError(400, 'Invalid token id', 'json')
    }

    try {
      const token = await Token.findOne(id)
      if (!token) {
        throw new ServerError(404, 'Token not found', 'json')
      }

      return {
        statusCode: 200,
        payload: { token: token.getData() }
      }
    } catch (err) {
      debug('GET, data:', data)
      debug(err)
      ServerError.throw(err)
    }

  },
  async put (data) {
    if (!data.payload) {
      throw new ServerError(400, 'Missing required fields', 'json')
    }
    const id = helpers.validateText(data.payload.id)
    if (!id || !id.length) {
      throw new ServerError(400, 'Invalid token id', 'json')
    }
    try {
      const token = await Token.readAndCheckToken(id)
      if (!token) {
        throw new ServerError(404, 'Token not found', 'json')
      }

      token.expires = Date.now() + config.TOKEN_EXPIRES
      const newToken = await token.save()
      if (!newToken) {
        throw new ServerError(500, 'Unable to update the token', 'json')
      }

      return {
        statusCode: 200,
        payload: { status: 'Ok' }
      }
    } catch (err) {
      debug('PUT, data:', data)
      debug(err)
      ServerError.throw(err)
    }
  },
  async delete (data) {
    if (!data.queryStringObject.id) {
      throw new ServerError(400, 'Missing id', 'json')
    }
    const id = helpers.validateText(data.queryStringObject.id)
    if (!id || !id.length) {
      throw new ServerError(400, 'Invalid token id', 'json')
    }

    try {
      const token = await Token.findOne(id)
      if (!token) {
        throw new ServerError(404, 'Token not found', 'json')
      }

      await token.delete()

      return {
        statusCode: 200,
        payload: { status: 'Ok' }
      }
    } catch (err) {
      debug('DELETE, data:', data)
      debug(err)
      ServerError.throw(err)
    }
  }
}
