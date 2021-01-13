import { Entity } from './common.js'
import _data from '../data.js'
import { ServerError } from '../error.js'
import { Cart } from './cart.js'

export class Order extends Entity {
  #status

  constructor() {
    super('orders', 'id')
    this.#status = 'new'
  }

  static async create (cart) {
    const isCartValid = cart instanceof Cart
    if (!isCartValid) {
      throw new ServerError(400, 'Invalid order cart', 'json')
    }

    const order = new Order()
    order.items = cart.items
    order.email = cart.email
    order.total = cart.total
    order.id = cart.id
    order.date = Date.now()

    const orderData = order._formData()
    const storedData = await _data.create(order.typeName, order[order.primaryKey], orderData)
    if (!storedData) {
      throw new ServerError(500, 'Error creating new order: unable to create new file', 'json')
    }

    return order
  }

  get status () {
    return this.#status
  }

  makePayment () {
    this.#status = 'payment succeeded'
    this.date = Date.now()
  }

  rejectPayment () {
    this.#status = 'payment rejected'
    this.date = Date.now()
  }
}