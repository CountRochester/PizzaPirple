import { html } from '../common.js'

export default class __CartItem extends HTMLElement {
  constructor() {
    super()
    this.itemId = this.getAttribute('item-id')
    this.itemName = this.getAttribute('name')
    this.itemPrice = +this.getAttribute('price')
    this.quantity = +this.getAttribute('quantity')
    this.attachShadow({ mode: 'open' })
  }

  render () {
    this.shadowRoot.innerHTML = html`
      <link rel="stylesheet" href="/public/components/__cart-item/__cart-item.css">
      <div class="cart-item">
        <div class="cart-item__name">${this.itemName}</div>
        <div class="cart-item__actionGroup">
          <div class="cart-item__buttonGroup">
            <button class="cart-item__decrementButton">-</button>
            <span class="cart-item__count">${this.quantity}</span>
            <button class="cart-item__incrementButton">+</button>
          </div>
          <div class="cart-item__price">${this.itemPrice}</div>
          <div class="cart-item__total">${(this.itemPrice * this.quantity).toFixed(2)}</div>
        </div>
      </div>
    `
    this.plusButton = this.shadowRoot.querySelector('.cart-item__incrementButton')
    this.minusButton = this.shadowRoot.querySelector('.cart-item__decrementButton')
    this.countElement = this.shadowRoot.querySelector('.cart-item__count')
    this.total = this.shadowRoot.querySelector('.cart-item__total')
  }

  updateCount () {
    this.countElement.innerText = this.quantity
    this.total.innerText = (this.itemPrice * this.quantity).toFixed(2)
    this.setAttribute('quantity', this.quantity)
  }

  encreaseCount () {
    this.quantity++
    this.updateCount()
  }

  decreaseCount () {
    this.quantity ? this.quantity-- : null
    this.updateCount()
  }

  connectedCallback () {
    this.render()
    this.encreaseCount = this.encreaseCount.bind(this)
    this.decreaseCount = this.decreaseCount.bind(this)
    this.plusButton.onclick = this.encreaseCount
    this.minusButton.onclick = this.decreaseCount
  }

  disconnectedCallback () {
    this.plusButton.removeEventListener('click', this.encreaseCount)
    this.minusButton.removeEventListener('click', this.decreaseCount)
  }

  attributeChangedCallback (attributeName, oldVal, newVal) {

  }

  static register () {
    window.customElements.define('cart-item', this)
  }
}