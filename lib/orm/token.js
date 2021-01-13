import { Entity, getLinkedEntity } from './common.js'
import { User } from './user.js'
import _data from '../data.js'
import helpers from '../helpers.js'
import config from '../config.js'
import { ServerError } from '../error.js'

export class Token extends Entity {
  constructor() {
    super('tokens', 'id')
  }

  static async create ({ email, password } = {}) {
    const badProps = []
    const newToken = new Token()

    newToken.id = helpers.createRandomString(config.TOKEN_LENGTH)
    newToken.email = helpers.validateText(email) || badProps.push('email')
    password = helpers.validateText(password) || badProps.push('password')
    newToken.expires = +Date.now() + config.TOKEN_EXPIRES

    if (badProps.length) {
      throw new ServerError(400, `Invalid tokens parametrs: ${badProps}`, 'json')
    }
    const tokensUser = await User.findOne(newToken.email)
    if (!tokensUser) {
      throw new ServerError(404, `Unable to create token: user with email ${email} not found`, 'json')
    }
    const hashedPassword = helpers.hash(password)
    if (tokensUser.password !== hashedPassword) {
      throw new ServerError(400, 'Error creating new token: incorrect password', 'json')
    }
    const tokenData = newToken._formData()
    const storedData = await _data.create(newToken.typeName, newToken[newToken.primaryKey], tokenData)
    if (!storedData) {
      throw new ServerError(500, 'Error creating new token: unable to create new file', 'json')
    }
    for (const key in storedData) {
      if (newToken[key] !== storedData[key]) {
        throw new ServerError(500, 'Error creating new token: stored data do not match entered values', 'json')
      }
    }
    tokensUser.token = newToken.id
    await tokensUser.save()
    return newToken
  }

  static async findAll () {
    return await super.findAll(this.readAndCheckToken)
  }

  async getUser () {
    return await getLinkedEntity.call(this, 'email', User)
  }

  async delete () {
    const user = await this.getUser()
    if (!user) {
      throw new ServerError(404, 'Unable to find the user', 'json')
    }
    delete user.token
    const savedUser = await user.save()
    if (!savedUser) {
      throw new ServerError(500, 'Unable to save the user', 'json')
    }
    await super.delete()
  }

  static async verifyToken (id, email) {
    try {
      const token = await this.findOne(id)
      if (!token) { return false }
      if (token.email === email && token.expires > +Date.now()) {
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  static async readAndCheckToken (id) {
    if (!id) {
      throw new ServerError(400, 'Invalid token id', 'json')
    }
    const token = await this.findOne(id)
    if (!token) {
      throw new ServerError(404, 'Token not found', 'json')
    }
    if (+Date.now() > token.expires) {
      await token.delete()
      throw new ServerError(406, 'Token has expired', 'json')
    }
    return token
  }
}