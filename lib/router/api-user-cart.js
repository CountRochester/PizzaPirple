import util from 'util'
import _data from '../data.js'
import { Cart } from '../orm/index.js'
import { checkToken } from './common.js'
import { ServerError } from '../error.js'

const debug = util.debuglog('carts')

/*

  items [
    {
      id: string,
      quantity: number
    },
    ...
  ]

*/

export default {
  async post (data) {
    if (!data.payload) {
      throw new ServerError(400, 'Missing required fields', 'json')
    }
    const items = Object.prototype.toString.call(data.payload.items) === '[object Array]'
      ? data.payload.items
      : false
    if (!items) {
      throw new ServerError(400, 'Missing items or they are invalid', 'json')
    }

    try {
      const tokenCheckResult = await checkToken(data)
      if (tokenCheckResult.statusCode !== 200) {
        return tokenCheckResult
      }

      const token = tokenCheckResult.payload
      const menu = await _data.read('', 'menu')
      if (!menu) {
        throw new ServerError(404, 'Unable to read menu', 'json')
      }

      const cartItems = []
      let total = 0
      const filteredItems = items.filter(item => item.quantity > 0)
      filteredItems.forEach((item) => {
        const meal = menu.items.find(el => el.id === item.id)
        if (meal && meal.price) {
          total += meal.price * item.quantity
          const existedCartItem = cartItems.find(el => el.id === meal.id)
          if (existedCartItem) {
            existedCartItem.quantity += item.quantity
          } else {
            cartItems.push({ id: meal.id, price: meal.price, quantity: item.quantity })
          }
        }
      })

      const user = await token.getUser()
      if (user.cart) {
        const cart = await user.getCart()

        cart.items = cartItems
        cart.total = Math.round(total * 100)

        const storedCart = await cart.save()
        if (!storedCart) {
          throw new ServerError(500, 'Unable to update cart', 'json')
        }

        return {
          statusCode: 200,
          payload: { message: `Cart of user ${token.email} successfully updated` }
        }
      } else {
        const cart = await Cart.create({
          email: token.email,
          items: cartItems,
          total: Math.round(total * 100)
        })
        if (!cart) {
          throw new ServerError(500, 'Unable to create cart', 'json')
        }
        return {
          statusCode: 200,
          payload: { message: `New cart successfully added to user ${token.email}` }
        }
      }

    } catch (err) {
      debug('GET, data:', data)
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
      const token = tokenCheckResult.payload

      const menu = await _data.read('', 'menu')
      if (!menu) {
        throw new ServerError(404, 'Unable to read menu', 'json')
      }

      const user = await token.getUser()
      if (!user) {
        throw new ServerError(404, `User with email ${token.email} not found`, 'json')
      }

      if (!user.cart) {
        return {
          statusCode: 200,
          payload: { message: 'Your cart is empty' }
        }
      }

      const usersCart = await user.getCart()
      if (!usersCart) {
        throw new ServerError(500, 'Unable to read user`s cart', 'json')
      }

      const outputItems = usersCart.items.map(item => ({
        ...menu.items.find(element => element.id === item.id),
        quantity: item.quantity
      }))

      const output = {
        id: usersCart.id,
        email: usersCart.email,
        items: outputItems,
        total: usersCart.total
      }
      return {
        statusCode: 200,
        payload: output
      }
    } catch (err) {
      debug('GET, data:', data)
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
      const token = tokenCheckResult.payload

      const user = await token.getUser()
      if (!user) {
        throw new ServerError(404, `User with email ${token.email} not found`, 'json')
      }

      if (!user.cart) {
        return {
          statusCode: 200,
          payload: { message: 'Your cart is already empty' }
        }
      }

      const usersCart = await user.getCart()
      if (!usersCart) {
        throw new ServerError(500, 'Unable to read user`s cart', 'json')
      }

      await usersCart.delete()
      return {
        statusCode: 200,
        payload: { message: 'User`s cart successfully deleted' }
      }
    } catch (err) {
      debug('DELETE, data:', data)
      debug(err)
      ServerError.throw(err)
    }
  }
}
