import https from 'https'
import util from 'util'
import querystring from 'querystring'
import _data from '../data.js'
import config from '../config.js'
import { checkToken } from './common.js'
import { ServerError } from '../error.js'
import { Order } from '../orm/order.js'

const debug = util.debuglog('orders')

async function createPaymentToken ({
  number = '4242424242424242',
  exp_month = 11,
  exp_year = 2029,
  cvc = 123
} = {}) {
  const payload = {
    'card[number]': number.replace(/ /g, ''),
    'card[exp_month]': exp_month,
    'card[exp_year]': exp_year,
    'card[cvc]': cvc
  }

  const stringPayload = querystring.stringify(payload)

  const requestDetails = {
    protocol: 'https:',
    hostname: config.PAYMENT_HOSTNAME,
    method: 'POST',
    path: config.PATMENT_CREATE_TOKEN,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${config.PAYMENT_SECRET_KEY}`,
      'Content-Length': Buffer.byteLength(stringPayload)
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(requestDetails, (res) => {
      const status = res.statusCode
      if (status !== 200 && status !== 201) {
        reject(`Error requesting payment token. Status code: ${status}`)
      }

      res.on('data', (data) => {
        resolve(JSON.parse(data.toString()))
      })

      res.on('error', (err) => {
        reject(err)
      })
    })
    req.on('error', (err) => { reject(err) })
    req.write(stringPayload)
    req.end()
  })
}

async function makePayment (amount, token) {
  const payload = {
    amount,
    currency: 'usd',
    'payment_method_data[type]': 'card',
    'payment_method_data[card][token]': token,
    confirm: true
  }

  const stringPayload = querystring.stringify(payload)

  const requestDetails = {
    protocol: 'https:',
    hostname: config.PAYMENT_HOSTNAME,
    method: 'POST',
    path: config.PAYMENT_PATH,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${config.PAYMENT_SECRET_KEY}`,
      'Content-Length': Buffer.byteLength(stringPayload)
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(requestDetails, (res) => {
      const status = res.statusCode
      if (status !== 200 && status !== 201) {
        console.log(res.body)
        reject(`Error requesting payment. Status code: ${status}`)
      }

      res.on('data', (data) => {
        resolve(JSON.parse(data.toString()))
      })

      res.on('error', (err) => {
        reject(err)
      })
    })

    req.on('error', (err) => { reject(err) })
    req.write(stringPayload)
    req.end()
  })
}

async function sendEmailMessage (to, subject, text) {
  const payload = {
    from: config.MAIL_SERVER_ADDRESS,
    to,
    subject,
    text
  }

  const stringPayload = querystring.stringify(payload)
  const auth = Buffer.from(`api:${config.MAIL_SECRET_KEY}`).toString('base64')

  const requestDetails = {
    protocol: 'https:',
    hostname: config.MAIL_HOST,
    method: 'POST',
    path: config.MAIL_PATH,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload),
      'Authorization': 'Basic ' + auth
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(requestDetails, (res) => {
      const status = res.statusCode
      if (status !== 200 && status !== 201) {
        reject(`Error sending email. Status code: ${status}`)
      }

      res.on('data', (data) => {
        let response = data.toString()
        if (response === 'Forbidden') {
          response = JSON.stringify({ response: 'Forbidden' })
        }
        resolve(JSON.parse(response))
      })

      res.on('error', (err) => {
        reject(err)
      })
    })

    req.on('error', (err) => { reject(err) })
    req.write(stringPayload)
    req.end()
  })
}

async function generateMessage (cart) {
  const menu = await _data.read('', 'menu')
  if (!menu) {
    throw new ServerError(404, 'Unable to read menu', 'json')
  }
  let counter = 1
  let orderMessage = cart.items
    .map((item) => {
      const menuItem = menu.items.find(el => el.id === item.id)
      return `${counter++}. ${menuItem.name} - ${item.quantity} x ${menuItem.price} usd\n`
    })
    .join('')
  orderMessage += `Total: ${cart.total / 100} usd`
  return orderMessage
}

export default {
  async post (data) {
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
        throw new ServerError(400, 'Your cart is empty', 'json')
      }

      const usersCart = await user.getCart()
      if (!usersCart) {
        throw new ServerError(500, `Unable to read user's cart`, 'json')
      }

      const amount = typeof usersCart.total === 'number' || typeof usersCart.total === 'string'
        ? (+usersCart.total) > 50
          ? Math.round(+usersCart.total)
          : false
        : false
      if (!amount) {
        throw new ServerError(400, 'Invalid cart amount. Amount must be more then 50 cents', 'json')
      }

      const order = await Order.create(usersCart)

      const orderMessage = await generateMessage(usersCart)
      const paymentToken = await createPaymentToken(data.payload?.card)
      const paymentResult = await makePayment(amount, paymentToken.id)

      if (paymentResult.status !== 'succeeded') {
        order.rejectPayment()
        await order.save()
        const message = `Thank you for your order in our restaurant.
        ${orderMessage}
        Your payment ${amount / 100} usd was not accepted.`

        const emailSendRes = await sendEmailMessage(user.email, 'Pizza delivery payment', message)
        debug(emailSendRes)
        throw new ServerError(400, `Your payment was not accepted, status: ${paymentResult.status}`, 'json')
      }

      order.makePayment()
      await order.save()

      const message = `Thank you for your order in our restaurant.
      ${orderMessage}
      Your payment ${amount / 100} usd successfully accepted.`
      const emailSendRes = await sendEmailMessage(user.email, 'Pizza delivery payment', message)
      debug(emailSendRes)

      await usersCart.delete()

      return {
        statusCode: 200,
        payload: { message: `Your payment ${amount / 100} successfully accepted` }
      }
    } catch (err) {
      debug('GET, data:', data)
      debug(err)
      ServerError.throw(err)
    }
  }
}