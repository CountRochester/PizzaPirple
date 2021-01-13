import { html } from '../common.js'

export default class __TopPanel extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.menuElements = [
      {
        link: '/',
        title: 'Home',
        loggedOut: true,
        loggedIn: true
      },
      {
        link: '/account/create',
        title: 'Signup',
        loggedOut: true,
        loggedIn: false
      },
      {
        link: '/session/create',
        title: 'Login',
        loggedOut: true,
        loggedIn: false
      },
      {
        link: '/menu',
        title: 'Menu',
        loggedOut: false,
        loggedIn: true
      },
      {
        link: '/account/edit',
        title: 'Account settings',
        loggedOut: false,
        loggedIn: true
      },
      {
        id: 'logoutButton',
        link: '#',
        title: 'Logout',
        loggedOut: false,
        loggedIn: true
      },
      {
        id: 'cartLink',
        link: '/cart',
        title: '',
        loggedOut: false,
        loggedIn: true
      }
    ]
    this.title = this.getAttribute('title')
    this.logged = this.getAttribute('logged') === 'true' ? true : false
    this.userCartTotal = this.getAttribute('cart-total') || 0
  }

  static get observedAttributes () {
    return ['title', 'logged', 'cart-total']
  }

  set userCartTotal (newVal) {
    this.setAttribute('cart-total', newVal)
    if (this.totalCounter) {
      this.totalCounter.innerText = newVal
    }
  }

  render () {
    this.shadowRoot.innerHTML = html`
      <link rel="stylesheet" href="/public/components/__top-panel/__top-panel.css">
      <div class="top-panel">
        <div class="top-panel__logo">
          <a class="top-panel__home-link" href="/">
            <img class="top-panel__logo-img" src="public/logo.png" alt="logo" />
          </a>
        </div>
        <div class="top-panel__header-title">
          <h1 class="top-panel__title">${this.title}</h1>
        </div>
        <div class="top-panel__menu">
          <ul class="top-panel__menu-ul">
          </ul>
        </div>
      </div>
    `
    this.menu = this.shadowRoot.querySelector('.top-panel__menu-ul')
    this.menuElements.forEach((menuItem) => {
      const canSowItemsForLoggedInUser = this.logged && menuItem.loggedIn
      const canSowItemsForLoggedOutUser = !this.logged && menuItem.loggedOut
      if (canSowItemsForLoggedInUser || canSowItemsForLoggedOutUser) {
        this.addMenuItem(menuItem)
      }
    })
    this.logoutButton = this.shadowRoot.getElementById('logoutButton')
    this.totalCounter = this.shadowRoot.querySelector('.top-panel__cart-total')

  }

  addMenuItem (menuItem) {
    const id = menuItem.id ? `id="${menuItem.id}"` : ''
    const liTemplate = document.createElement('template')
    if (menuItem.id === 'cartLink') {
      liTemplate.innerHTML = html`
          <li class="top-panel__menu-item">
            <a ${id} class="top-panel__menu-item-link" href="${menuItem.link}">
              <img class="top-panel__menu-item-icon" src="public/cart-variant.png" alt="cart">
              <span class="top-panel__cart-total">${this.userCartTotal || '0'}</span>
            </a>
            <div class="top-panel__menu-bar"></div>
          </li>
        `
    } else {
      liTemplate.innerHTML = html`
          <li class="top-panel__menu-item">
            <a ${id} class="top-panel__menu-item-link" href="${menuItem.link}">${menuItem.title}</a>
            <div class="top-panel__menu-bar"></div>
          </li>
        `
    }
    this.menu.appendChild(liTemplate.content)
  }

  async logout (ev) {
    ev.preventDefault()
    await app.logUserOut()
    this.render()
  }

  connectedCallback () {
    this.render()
    if (this.logoutButton) {
      this.logoutButton.onclick = this.logout
    }
  }

  disconnectedCallback () {
    this.logoutButton.removeEventListener('click', this.logout)
  }

  attributeChangedCallback (attributeName, oldVal, newVal) {
    const needToRerender = oldVal !== newVal && attributeName !== 'cart-total'
    if (needToRerender) {
      if (this.logoutButton) {
        this.logoutButton.removeEventListener('click', this.logout)
      }
      this.logged = this.getAttribute('logged') === 'true' ? true : false
      this.logged = this.getAttribute('logged') === 'true' ? true : false
      this.userCartTotal = this.getAttribute('cart-total')
      this.render()
      if (this.logoutButton) {
        this.logoutButton.onclick = this.logout
      }
    }
  }

  static register () {
    window.customElements.define('top-panel', this)
  }
}