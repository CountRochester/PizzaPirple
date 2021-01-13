import { html } from '../common.js'

export default class __ButtonComponent extends HTMLElement {
  constructor() {
    super()
    this.href = this.getAttribute('href')
    this.type = this.getAttribute('type')
    const color = this.getAttribute('color')
    this.color = ['blue', 'green', 'red'].includes(color)
      ? color
      : 'blue'
    this.attachShadow({ mode: 'open' })
  }

  get onclick () {
    return this.button ? this.button.onclick : null
  }

  set onclick (val) {
    if (this.button) {
      this.button.onclick = val
    }
  }

  render () {
    const content = this.href
      ? `<a class="button-component__button button-component__button_${this.color}" href="${this.href}"><slot></slot></a>`
      : ` <button type="${this.type}" class="button-component__button button-component__button_${this.color}">
            <slot></slot>
          </button>`
    this.shadowRoot.innerHTML = html`
      <link rel="stylesheet" href="/public/components/__button-component/__button-component.css">
      <div class="button-component">
        ${content}
      </div>
      <slot name="hidden1"></slot>
    `
    this.button = this.shadowRoot.querySelector(`.button-component__button_${this.color}`)

    this.addHiddenInput()
  }

  addHiddenInput () {
    if (this.type !== 'submit') { return }
    if (this.lightInput) { return }

    this.innerHTML += html`
      <button slot="hidden1" hidden type="submit" class="dummy-input"></button>
    `
    this.lightInput = this.querySelector('.dummy-input')
  }

  connectedCallback () {
    this.render()
    if (this.type === 'submit') {
      const self = this
      this.button.onclick = () => {
        self.lightInput.click()
      }
    }
  }

  disconnectedCallback () {
  }

  attributeChangedCallback (attributeName, oldVal, newVal) {

  }

  static register () {
    window.customElements.define('button-component', this)
  }
}