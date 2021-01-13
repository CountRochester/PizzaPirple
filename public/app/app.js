import __MenuItem from '/public/components/__menu-item/__menu-item.js'
import __TopPanel from '/public/components/__top-panel/__top-panel.js'
import __ButtonComponent from '/public/components/__button-component/__button-component.js'
import __TextInput from '/public/components/__text-input/__text-input.js'
import __CartItem from '/public/components/__cart-item/__cart-item.js'
import {
  formHandler, handlePasswordRetype, loadDataOnAccountEditForm, loadEmailOnForm,
  showMessageOnForm, formRequestUrl, handleResponceError, inputOnlyDigits, inputOnlyDigitsMinMax
} from '/public/app/handlers.js'

import { html } from '/public/components/common.js'

const app = {
  config: {
    sessionToken: false,
    cart: false,
    components: {}
  },

  client: {
    async request ({ headers = {}, path = '/', method = 'GET', queryStringObject = {}, payload = {} }) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
      headers.Accept = headers.Accept || 'application/json'

      const token = app.getToken()
      if (token) {
        headers.token = token.id
      }

      const requestUrl = formRequestUrl(path, queryStringObject)
      const body = JSON.stringify(payload)
      const options = {
        headers,
        method,
        body: body !== '{}' ? body : undefined
      }

      try {
        const responce = await fetch(requestUrl, options)
        const output = await responce.json()

        handleResponceError(responce, output)

        return {
          statusCode: responce.status,
          status: responce.statusText,
          payload: output
        }
      } catch (err) {
        throw err
      }
    }
  },

  setTitle (str) {
    if (app.config.components.topPanel) {
      app.config.components.topPanel.setAttribute('title', str)
    }
  },

  bindLogoutButton () {
    const button = document.getElementById('logoutButton')
    if (button) {
      button.addEventListener('click', async (e) => {
        e.preventDefault()
        await app.logUserOut()
      })
    }
  },

  bindForms () {
    const forms = document.querySelectorAll('form')
    if (forms.length) {
      forms.forEach((form) => {
        const formId = form.getAttribute('id')
        if (formId === 'newOrder') {
          app.prepareOrderForm(form)
          form.addEventListener('submit', (ev) => {
            formHandler(ev, form, app, '/order/made', 1000)
          })
        } else {
          form.addEventListener('submit', (ev) => {
            formHandler(ev, form, app)
          })
        }
      })
    }
  },

  bindFormUserPasswordEdit () {
    const form = document.getElementById('passwordEdit')

    if (form) {
      let passwordInput, passwordRetype

      for (let i = 0; i < form.elements.length; i++) {
        if (form.elements[i].name === 'password') { passwordInput = form.elements[i] }
        if (form.elements[i].name === 'passwordRetype') { passwordRetype = form.elements[i] }
      }

      passwordRetype.oninput = handlePasswordRetype(passwordInput, passwordRetype, form)
      passwordInput.oninput = handlePasswordRetype(passwordInput, passwordRetype, form)
    }
  },

  prepareOrderForm (form) {
    const inputs = Array.from(form.querySelectorAll('text-input'))
    const numberInput = inputs.find(inp => inp.getAttribute('name') === 'number')
    const monthInput = inputs.find(inp => inp.getAttribute('name') === 'exp_month')
    const yearInput = inputs.find(inp => inp.getAttribute('name') === 'exp_year')
    const cvcInput = inputs.find(inp => inp.getAttribute('name') === 'cvc')

    numberInput.oninput = ({ data }) => {
      let val = numberInput.lightInput.value.replace(/ /g, '')
      if ('0123456789'.includes(data)) {
        val += data
      } else if (data === null) {
        val = val.slice(0, val.length - 1)
      }
      if (val.length > 16) {
        val = val.slice(0, 16)
      }

      let outputVal = val.match(/.{1,4}/g) || []
      outputVal = outputVal.join(' ')
      numberInput.lightInput.value = outputVal
    }

    monthInput.oninput = inputOnlyDigits(monthInput)
    monthInput.onchange = inputOnlyDigitsMinMax(monthInput, 1, 12)
    yearInput.oninput = inputOnlyDigits(yearInput)
    yearInput.onchange = inputOnlyDigitsMinMax(yearInput, 2020, 2050)
    cvcInput.oninput = inputOnlyDigits(cvcInput)

  },

  async loadDataOnPage () {
    const currentPath = window.location.pathname

    if (currentPath === '/account/edit') {
      await app.loadAccountEditPage()
    }

    if (currentPath.includes('menu')) {
      app.handleMenu()
    }

    if (currentPath === '/cart') {
      app.handleCart()
    }
  },

  async loadAccountEditPage () {
    if (!app.isTokenValid()) { return }

    const email = app.getUserEmail()
    const queryStringObject = { email }

    const accountEditForm = document.getElementById('accountEdit')

    try {
      const userResult = await app.client.request({ path: 'api/users', method: 'GET', queryStringObject })

      loadDataOnAccountEditForm(userResult)
      loadEmailOnForm(email, 'passwordEdit')
      loadEmailOnForm(email, 'deleteAccount')
    } catch (err) {
      showMessageOnForm(accountEditForm, 'formError', err.message)
    }
  },

  async formResponseProcessor (form, requestPayload, responsePayload) {
    if (form.id == 'accountCreate') {
      const newPayload = {
        email: requestPayload.email,
        password: requestPayload.password
      }
      try {
        const result = await app.client.request({ path: 'api/tokens', method: 'POST', payload: newPayload })
        app.setSessionToken(result.payload.token)
        window.location = '/'
      } catch (err) {
        showMessageOnForm(form, 'formError', err.message)
      }
    }
    if (form.id === 'sessionCreate') {
      window.location = '/menu'
      app.setSessionToken(responsePayload.token)
    }
    if (form.id === 'deleteAccount') {
      app.logUserOut(false)
      window.location = '/account/deleted'
    }
  },

  calcTotal () {
    const total = app.config.cart.items.reduce((acc, element) => acc += element.price * element.quantity, 0)
    return total.toFixed(2) || 0
  },

  addToCart (item) {
    if (!app.config.cart) {
      app.config.cart = { items: [], total: 0 }
    }

    const buyingItem = {
      id: item.itemId || item.id,
      quantity: +item.count || +item.quantity || 1,
      price: +item.itemPrice || +item.price,
      name: item.name
    }

    app.config.cart.items.push(buyingItem)
    app.config.cart.total = app.calcTotal()
    item.addToCart && item.addToCart()
  },

  getCartItems () {
    return app.config.cart.items.map(item => ({ id: item.id, quantity: item.quantity }))
  },

  updateCart (cartFromServer) {
    app.config.cart = { items: [], total: 0 }
    if (cartFromServer.items) {
      cartFromServer.items.forEach(app.addToCart)
    }
    if (!app.config.cart.items.length) {
      app.config.cart = { items: [], total: 0 }
    } else {
      app.config.cart.total = app.calcTotal()
    }
    const topToolbar = document.querySelector('top-panel')
    topToolbar.userCartTotal = app.config.cart.total
    localStorage.setItem('cart', JSON.stringify(app.config.cart))
  },

  async loadCartFromServer () {
    const cartFromServer = await app.client.request({ path: 'api/cart', method: 'GET' })
    app.updateCart(cartFromServer.payload)
  },

  async sendCartContentToServer () {
    const payload = {
      items: app.getCartItems()
    }
    try {
      await app.client.request({ path: 'api/cart', method: 'POST', payload })
      await app.loadCartFromServer()
    } catch (err) {
      console.log(err)
      throw err
    }
  },

  handleMenu () {
    const loadedMenu = document.querySelectorAll('menu-item')
    const topToolbar = document.querySelector('top-panel')
    loadedMenu.forEach((item) => {
      item.buyButton.onclick = async () => {
        app.addToCart(item)
        await app.sendCartContentToServer()
        topToolbar.userCartTotal = app.config.cart.total
      }
    })
  },

  handleCart () {
    const cartContent = document.querySelector('.cart-content')
    const cartItems = app.config.cart.items
    let content = ''
    if (cartItems.length) {
      cartItems.forEach((item) => {
        content += html`
        <cart-item item-id="${item.id}" name="${item.name}" price="${item.price}" quantity="${item.quantity}"></cart-item>
      `
      })
      content += html`
      <div class="divider"></div>
      <div class="cart-total">${app.config.cart.total}</div>
    `
      cartContent.innerHTML = content
      const cartTotalOnPage = cartContent.querySelector('.cart-total')
      const cartItemsOnPage = Array.from(cartContent.querySelectorAll('cart-item'))

      cartContent.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'quantity') {
            cartTotalOnPage.innerText = cartItemsOnPage
              .map(el => (+el.getAttribute('quantity') * +el.getAttribute('price')))
              .reduce((acc, el) => acc + el, 0)
              .toFixed(2)
          }
        }
      })
      cartItemsOnPage.forEach((cartItem) => {
        cartContent.observer.observe(cartItem, { attributes: true })
      })

      const deleteCartButton = document.getElementById('deleteCart')
      deleteCartButton.onclick = app.purgeOrder

      const orderButton = document.getElementById('order')
      orderButton.onclick = () => {
        window.location = '/order'
      }

      const updateCartButton = document.getElementById('updateCart')
      updateCartButton.onclick = app.updateOrder(cartItemsOnPage)
    } else {
      cartContent.innerHTML = html`
        <div class="emptyCart">Your cart is empty</div>
      `
      const actionGroup = document.querySelector('.actionsGroup')
      actionGroup.style.display = 'none'
    }
  },

  async purgeOrder () {
    await app.client.request({ path: 'api/cart', method: 'DELETE' })
    window.location = '/menu'
  },

  updateOrder (cartItemsOnPage) {
    return async () => {
      const cartItems = app.config.cart.items
      cartItemsOnPage.forEach((item) => {
        const itemId = item.getAttribute('item-id')
        const quantity = item.getAttribute('quantity')
        const cartItem = cartItems.find(el => el.id === itemId)
        cartItem.quantity = quantity
      })
      await app.sendCartContentToServer()
      const cartContent = document.querySelector('.cart-content')
      cartContent.observer.disconnect()
      app.handleCart()
    }
  },

  getSessionToken () {
    const tokenString = localStorage.getItem('token')

    if (tokenString) {
      try {
        const token = JSON.parse(tokenString)
        app.config.sessionToken = token

        if (typeof token === 'object') {
          app.setLoggedInClass(true)
        } else {
          app.setLoggedInClass(false)
        }
      } catch (err) {
        app.config.sessionToken = false
        app.setLoggedInClass(false)
      }
    }
  },

  setLoggedInClass (add) {
    const target = document.querySelector('body')
    if (add) {
      target.classList.add('loggedIn')
    } else {
      target.classList.remove('loggedIn')
    }
  },

  setSessionToken (token) {
    app.config.sessionToken = token
    const tokenString = JSON.stringify(token)

    localStorage.setItem('token', tokenString)

    if (typeof token === 'object') {
      app.setLoggedInClass(true)
    } else {
      app.setLoggedInClass(false)
    }
  },

  async renewToken () {
    const currentToken = app.getToken()

    if (!currentToken) {
      app.setSessionToken(false)
      return
    }
    try {
      const payload = {
        id: currentToken.id
      }

      const tokenResult = await app.client.request({ path: 'api/tokens', method: 'PUT', payload })
      if (tokenResult.statusCode !== 200) {
        app.setSessionToken(false)
        return
      }

      const queryStringObject = { id: currentToken.id }
      const newTokenResult = await app.client.request({ path: 'api/tokens', method: 'GET', queryStringObject })
      if (newTokenResult.statusCode !== 200) {
        app.setSessionToken(false)
        return
      }

      app.setSessionToken(newTokenResult.payload.token)
    } catch (err) {
      throw err
    }

  },

  async logUserOut (redirectUser) {
    redirectUser = typeof (redirectUser) === 'boolean' ? redirectUser : true
    const token = app.getToken()
    if (!token) { return }

    try {
      const queryStringObject = { id: token.id }
      await app.client.request({ path: 'api/tokens', method: 'DELETE', queryStringObject })

      app.setSessionToken(false)
      if (redirectUser) {
        window.location = '/session/deleted'
      }
    } catch (err) {
      console.log(err)
    }

  },

  tokenRenewalLoop () {
    setInterval(async () => {
      try {
        await app.renewToken()
        if (app.isTokenValid()) {
          console.log('Token renewed successfully @ ' + Date.now())
        }
      } catch (err) {
        console.log(err)
      }
    }, 1000 * 60)
  },

  registerComponents () {
    __MenuItem.register()
    __TopPanel.register()
    __ButtonComponent.register()
    __TextInput.register()
    __CartItem.register()

    app.config.components.topPanel = document.querySelector('top-panel')
    const logged = app.isTokenValid() ? 'true' : 'false'
    app.config.components.topPanel.setAttribute('logged', logged)
  },

  loadCart () {
    const cart = localStorage.getItem('cart')
    if (cart) {
      app.config.cart = JSON.parse(cart)
      const topToolbar = document.querySelector('top-panel')
      topToolbar.userCartTotal = app.config.cart.total
    }
  },

  async init () {
    this.getSessionToken()
    this.registerComponents()
    this.bindForms()
    this.bindFormUserPasswordEdit()

    this.tokenRenewalLoop()
    this.loadCart()
    await this.loadDataOnPage()
    await app.loadCartFromServer()
  },

  getToken () {
    return typeof (app.config.sessionToken) === 'object' ? app.config.sessionToken : false
  },

  getUserEmail () {
    return app.config.sessionToken ? app.config.sessionToken.email : ''
  },

  isTokenValid () {
    const token = app.getToken()
    if (!token) { return false }

    const isExpired = +token.expires < +Date.now()
    return token.id && !isExpired
  }
}

window.onload = () => {
  window.app = app
  app.init()
  app.setTitle('Welcome to PIZZA delivery online')
}