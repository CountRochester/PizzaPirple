import { Entity, getLinkedEntity } from './common.js'
import { Token } from './token.js'
import { Cart } from './cart.js'
import _data from '../data.js'
import helpers from '../helpers.js'
import { ServerError } from '../error.js'

export class User extends Entity {

  constructor() {
    super('users', 'email')
    this.privateKeys = ['password', 'token']
    this.lastTimeLogged = Date.now()
  }

  static async create ({ firstName, lastName, email, address, password, tosAgreement } = {}) {
    const badProps = []
    const newUser = new User()

    newUser.firstName = helpers.validateText(firstName) || badProps.push('firstName')
    newUser.lastName = helpers.validateText(lastName) || badProps.push('lastName')
    newUser.email = helpers.validateText(email) || badProps.push('email')
    newUser.address = helpers.validateText(address) || badProps.push('address')
    newUser.password = helpers.validateText(password) || badProps.push('password')
    newUser.tosAgreement = helpers.validateBool(tosAgreement) || badProps.push('tosAgreement')

    if (badProps.length) {
      throw new ServerError(400, `Invalid users parametrs: ${badProps}`, 'json')
    }
    const userData = newUser._formData()
    const storedData = await _data.create(newUser.typeName, newUser[newUser.primaryKey], userData)
    if (!storedData) {
      throw new ServerError(500, 'Error creating new user: anable to create new file', 'json')
    }
    for (const key in storedData) {
      if (newUser[key] !== storedData[key]) {
        throw new ServerError(500, 'Error creating new user: stored data do not match entered values', 'json')
      }
    }
    return newUser
  }

  async delete () {
    const token = await this.getToken()
    token && await token.delete()
    const cart = await this.getCart()
    cart && await cart.delete()
    await super.delete()
  }

  async getToken () {
    return await getLinkedEntity.call(this, 'token', Token)
  }

  async getCart () {
    return await getLinkedEntity.call(this, 'cart', Cart)
  }

  updateLoginTime () {
    this.lastTimeLogged = Date.now()
  }
}