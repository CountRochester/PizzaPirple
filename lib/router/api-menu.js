import helpers from '../helpers.js'
import _data from '../data.js'
import { checkToken } from './common.js'
import { ServerError } from '../error.js'

export default {
  async get (data) {
    if (!data.queryStringObject) {
      throw new ServerError(400, 'Incorrect GET parametrs', 'json')
    }

    const id = helpers.validateText(data.queryStringObject.id)
    const category = helpers.validateText(data.queryStringObject.category)
    if ((!category || !category.length) && !id) {
      throw new ServerError(400, 'Invalid menu category or id', 'json')
    }

    try {
      const tokenCheckResult = await checkToken(data)
      if (tokenCheckResult.statusCode !== 200) {
        return tokenCheckResult
      }

      const menu = await _data.read('', 'menu')
      if (!menu) {
        throw new ServerError(404, 'Unable to read menu', 'json')
      }

      const output = id
        ? menu.items.find(el => el.id === id)
        : menu.items.filter(el => el.category === category)
      if (!output) {
        throw new ServerError(404, 'Incorrect menu category', 'json')
      }

      const payloadOut = id
        ? { menuItem: output }
        : { menu: output }

      return {
        statusCode: 200,
        payload: payloadOut
      }
    } catch (err) {
      ServerError.throw(err)
    }
  }
}