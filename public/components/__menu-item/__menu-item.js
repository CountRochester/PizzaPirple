import { html } from '../common.js'

export default class __MenuItem extends HTMLElement {
  constructor() {
    super()
    this.itemId = this.getAttribute('item-id')
    this.itemName = this.getAttribute('name')
    this.itemDescription = this.getAttribute('description')
    this.itemPrice = +this.getAttribute('price')
    this.itemImage = this.getAttribute('pic')
    this.attachShadow({ mode: 'open' })
    this.count = 0
  }

  render () {
    this.shadowRoot.innerHTML = html`
      <link rel="stylesheet" href="/public/components/__menu-item/__menu-item.css">
      <div class="menu-item">
        <h2 class="menu-item__itemName">${this.itemName}</h2>
        <div class="menu-item__description">
          <p class="menu-item__itemDescription">${this.itemDescription}</p>
        </div>
        <img class="menu-item__itemImage" src="${this.itemImage}" alt="${this.itemName}">
        <div class="menu-item__actionGroup">
          <span class="menu-item__itemPrice">${this.itemPrice}</span>
          <div class="menu-item__buttonGroup">
            <button class="menu-item__incrementButton">+</button>
            <span class="menu-item__count">0</span>
            <button class="menu-item__decrementButton">-</button>
            <button class="menu-item__buyButton">Add to cart</button>
          </div>
        </div>
      </div>
    `
    this.nameElement = this.shadowRoot.querySelector('.menu-item__itemName')
    this.descriptionElement = this.shadowRoot.querySelector('.menu-item__itemDescription')
    this.priceElement = this.shadowRoot.querySelector('.menu-item__itemPrice')
    this.picElement = this.shadowRoot.querySelector('.menu-item__itemImage')
    this.plusButton = this.shadowRoot.querySelector('.menu-item__incrementButton')
    this.minusButton = this.shadowRoot.querySelector('.menu-item__decrementButton')
    this.countElement = this.shadowRoot.querySelector('.menu-item__count')
    this.buyButton = this.shadowRoot.querySelector('.menu-item__buyButton')
  }

  updateCount () {
    this.countElement.innerText = this.count
  }

  encreaseCount () {
    this.count++
    this.updateCount()
  }

  decreaseCount () {
    this.count ? this.count-- : null
    this.updateCount()
  }

  addToCart () {
    this.count = 0
    this.updateCount()
  }

  connectedCallback () {
    this.render()
    this.plusButton.onclick = this.encreaseCount.bind(this)
    this.minusButton.onclick = this.decreaseCount.bind(this)
    this.buyButton.onclick = this.addToCart.bind(this)
  }

  disconnectedCallback () {
    this.plusButton.removeEventListener('click', this.encreaseCount)
    this.minusButton.removeEventListener('click', this.decreaseCount)
    this.buyButton.removeEventListener('click', this.addToCart)
  }

  attributeChangedCallback (attributeName, oldVal, newVal) {

  }

  static register () {
    window.customElements.define('menu-item', this)
  }
}