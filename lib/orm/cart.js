import { Entity, getLinkedEntity } from './common.js'
import { User } from './user.js'
import _data from '../data.js'
import helpers from '../helpers.js'
import config from '../config.js'
import { ServerError } from '../error.js'

export class Cart extends Entity {
  constructor() {
    super('carts', 'id')
  }

  static async create ({ email, items = [], total = 0 } = {}) {
    const badProps = []
    const cart = new Cart()
    cart.id = helpers.createRandomString(config.CART_ID_LENGTH)
    cart.email = helpers.validateText(email)
    if (!cart.email) { badProps.push('email') }

    if (Object.prototype.toString.call(items) === '[object Array]') {
      cart.items = items
    } else { badProps.push('items') }

    if (typeof total === 'number' && total > 50) {
      cart.total = total
    } else { badProps.push('total') }

    if (badProps.length) {
      throw new ServerError(400, `Invalid cart parametrs: ${badProps}`, 'json')
    }
    const user = await User.findOne(email)
    const cartData = cart._formData()
    if (!user) {
      throw new ServerError(400, 'Invalid user email', 'json')
    }
    if (user.cart) {
      throw new ServerError(400, 'Cart already exists', 'json')
    }
    const storedData = await _data.create(cart.typeName, cart[cart.primaryKey], cartData)
    if (!storedData) {
      throw new ServerError(500, 'Error creating new cart: anable to create the file', 'json')
    }
    user.cart = cart.id
    const savedUser = await user.save()
    if (!savedUser) {
      throw new ServerError(500, 'Unable to save the user', 'json')
    }
    return cart
  }

  async delete () {
    const user = await this.getUser()
    if (!user) {
      throw new ServerError(404, 'Unable to find the user', 'json')
    }
    delete user.cart

    const savedUser = await user.save()
    if (!savedUser) {
      throw new ServerError(500, 'Unable to save the user', 'json')
    }
    await super.delete()
  }

  async getUser () {
    return await getLinkedEntity.call(this, 'email', User)
  }
}