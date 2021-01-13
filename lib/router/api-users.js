import util from 'util'
import _data from '../data.js'
import helpers from '../helpers.js'
import { User } from '../orm/index.js'
import { checkToken } from './common.js'
import { ServerError } from '../error.js'

const debug = util.debuglog('users')

const requiredFields = ['firstName', 'lastName', 'email', 'address', 'password', 'tosAgreement']

function validateUser (user, force) {
  const absentKeys = []
  const output = {}
  if (!user) { return { absentKeys: requiredFields } }

  output.firstName = helpers.validateText(user.firstName)
  output.firstName || absentKeys.push('firstName')
  output.lastName = helpers.validateText(user.lastName)
  output.lastName || absentKeys.push('lastName')
  output.password = helpers.validateText(user.password)
  output.password || absentKeys.push('password')
  output.email = helpers.validateText(user.email)
  output.email || absentKeys.push('email')
  output.address = helpers.validateText(user.address)
  output.address || absentKeys.push('address')
  const tos = helpers.validateTos(user.tosAgreement)
  output.tosAgreement = tos || output.tosAgreement
  tos || absentKeys.push('tosAgreement')

  if (force) {
    return {
      absentKeys,
      user: output
    }
  }
  return {
    absentKeys,
    user: !absentKeys.length && output.tosAgreement ? output : null
  }
}

export default {
  async post (data) {
    if (!data.payload) {
      throw new ServerError(400, 'Missing required fields', 'json')
    }
    const { user, absentKeys } = validateUser(data.payload)
    if (!user) {
      throw new ServerError(400, `Missing required fields ${absentKeys}`, 'json')
    }

    try {
      const existedUser = await User.findOne(user.email)
      if (existedUser) {
        throw new ServerError(400, `A user with email ${user.email} already exists`, 'json')
      }

      user.password = helpers.hash(user.password)
      if (!user.password) {
        throw new ServerError(500, 'Error hashing the password', 'json')
      }

      const newUser = await User.create(user)
      if (!newUser) {
        throw new ServerError(500, 'Error creating new user', 'json')
      }

      return {
        statusCode: 200,
        payload: { status: 'Ok' }
      }
    } catch (err) {
      debug('POST, data:', data)
      debug(err)
      ServerError.throw(err)
    }
  },
  async get (data) {
    try {
      const tokenCheckResult = await checkToken(data)
      if (tokenCheckResult.statusCode !== 200) {
        return tokenCheckResult
      }

      const email = helpers.validateText(data.queryStringObject.email || data.payload.email)
      const user = await User.findOne(email)
      if (!user) {
        throw new ServerError(404, `User with email ${email} not found`, 'json')
      }

      return {
        statusCode: 200,
        payload: user.getData()
      }
    } catch (err) {
      debug('GET, data:', data)
      debug(err)
      ServerError.throw(err)
    }
  },
  async put (data) {
    try {
      const tokenCheckResult = await checkToken(data)
      if (tokenCheckResult.statusCode !== 200) {
        return tokenCheckResult
      }

      const email = helpers.validateText(data.payload.email)
      const deltaUser = validateUser(data.payload, true)
      if (deltaUser.absentKeys.length >= 5) {
        throw new ServerError(400, 'Missing required fields', 'json')
      }

      const user = await User.findOne(email)
      if (!user) {
        throw new ServerError(404, `User with email ${email} not found`, 'json')
      }

      for (const key in deltaUser.user) {
        if (key === 'password') {
          user.password = helpers.hash(deltaUser.user.password)
        } else {
          user[key] = deltaUser.user[key] || user[key]
        }
      }

      if (deltaUser.user.password && !user.password) {
        throw new ServerError(500, 'Error hashing the password', 'json')
      }

      const updatedUser = await user.save()
      if (!updatedUser) {
        throw new ServerError(500, 'Failed to update the user', 'json')
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
    try {
      const tokenCheckResult = await checkToken(data)
      if (tokenCheckResult.statusCode !== 200) {
        return tokenCheckResult
      }

      const email = helpers.validateText(data.queryStringObject.email || data.payload.email)
      const user = await User.findOne(email)
      if (!user) {
        throw new ServerError(404, `User with email ${email} not found`, 'json')
      }

      await user.delete()

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
