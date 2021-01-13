import usersHandlers from './api-users.js'
import tokensHandlers from './api-tokens.js'
import menuHandlers from './api-menu.js'
import cartHandlers from './api-user-cart.js'
import orderHandlers from './api-order.js'
import pageTemplates from '../page-templates.js'
import publicHandler from './public.js'
import { ServerError } from '../error.js'

async function defaultHandler (acceptableMethods, data, handler) {
  if (acceptableMethods.includes(data.method)) {
    return await handler[data.method](data)
  } else {
    throw new ServerError(405, 'Method Not Allowed')
  }
}

const defaultApiHandler = (methods, handlers) => (data) => {
  try {
    return defaultHandler(methods, data, handlers)
  } catch (err) {
    if (!err.payload) { ServerError.throw(err) }
    return {
      statusCode: err.statusCode,
      payload: err.payload
    }
  }
}

function formSuccessResponse (payload) {
  return {
    statusCode: 200,
    payload,
    contentType: 'html'
  }
}

export default {
  '': async (data) => {
    data['head.title'] = 'Welcome'
    data['header.title'] = 'Pizza delivery online'
    data['head.description'] = 'Wellcome to Pizzza delivery online - best taste pizza in your city'
    const payload = await pageTemplates.formPage('default', 'index', data)
    return formSuccessResponse(payload)
  },
  'notFound': () => {
    throw new ServerError(404, 'Not found')
  },
  'api/users': defaultApiHandler(['post', 'get', 'put', 'delete'], usersHandlers),
  'api/tokens': defaultApiHandler(['post', 'get', 'put', 'delete'], tokensHandlers),
  'api/menu': defaultApiHandler(['get'], menuHandlers),
  'api/cart': defaultApiHandler(['post', 'get', 'delete'], cartHandlers),
  'api/order': defaultApiHandler(['post'], orderHandlers),
  'account/create': async (data) => {
    data['head.title'] = 'Sign in'
    data['header.title'] = 'Creating new pizza fan'
    data['head.description'] = 'We glad you to join our community'
    const payload = await pageTemplates.formPage('default', 'account-create', data)
    return formSuccessResponse(payload)
  },
  'account/edit': async (data) => {
    data['head.title'] = 'Account edit'
    data['header.title'] = 'Edit your account data'
    const payload = await pageTemplates.formPage('default', 'account-edit', data)
    return formSuccessResponse(payload)
  },
  'account/deleted': async (data) => {
    data['head.title'] = 'Account deleted'
    data['header.title'] = 'Account deleted'
    data['head.description'] = 'We will miss you'
    const payload = await pageTemplates.formPage('default', 'account-deleted', data)
    return formSuccessResponse(payload)
  },
  'session/create': async (data) => {
    data['head.title'] = 'Login'
    data['header.title'] = 'Login to your account'
    data['head.description'] = 'We missed you'
    const payload = await pageTemplates.formPage('default', 'session-create', data)
    return formSuccessResponse(payload)
  },
  'session/deleted': async (data) => {
    data['head.title'] = 'Logged out'
    data['header.title'] = 'You have been logged out from your account'
    data['head.description'] = 'Logged out'
    const payload = await pageTemplates.formPage('default', 'session-deleted', data)
    return formSuccessResponse(payload)
  },
  menu: async (data) => {
    data['head.title'] = 'Menu'
    data['header.title'] = 'Menu'
    const payload = await pageTemplates.formMenuPage(data)
    return formSuccessResponse(payload)
  },
  'menu/starters': async (data) => {
    data['head.title'] = 'Menu'
    data['header.title'] = 'Menu'
    const payload = await pageTemplates.formMenuPage(data, 'starters')
    return formSuccessResponse(payload)
  },
  'menu/mains': async (data) => {
    data['head.title'] = 'Menu'
    data['header.title'] = 'Menu'
    const payload = await pageTemplates.formMenuPage(data, 'mains')
    return formSuccessResponse(payload)
  },
  'menu/desserts': async (data) => {
    data['head.title'] = 'Menu'
    data['header.title'] = 'Menu'
    const payload = await pageTemplates.formMenuPage(data, 'desserts')
    return formSuccessResponse(payload)
  },
  'menu/drinks': async (data) => {
    data['head.title'] = 'Menu'
    data['header.title'] = 'Menu'
    const payload = await pageTemplates.formMenuPage(data, 'drinks')
    return formSuccessResponse(payload)
  },
  cart: async (data) => {
    data['head.title'] = 'Order'
    data['header.title'] = 'Ready to make your order?'
    const payload = await pageTemplates.formPage('default', 'cart', data)
    return formSuccessResponse(payload)
  },
  order: async (data) => {
    data['head.title'] = 'New order'
    data['header.title'] = 'Enter credit card data'
    const payload = await pageTemplates.formPage('default', 'new-order', data)
    return formSuccessResponse(payload)
  },
  'order/made': async (data) => {
    data['head.title'] = 'Payment accepted'
    data['header.title'] = 'Order made'
    const payload = await pageTemplates.formPage('default', 'order-made', data)
    return formSuccessResponse(payload)
  },
  'favicon.ico': publicHandler.favicon,
  public: publicHandler.default
}