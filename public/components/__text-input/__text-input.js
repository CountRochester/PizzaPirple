import { html } from '../common.js'

export default class __TextInput extends HTMLElement {
  constructor() {
    super()
    this.name = this.getAttribute('name') || ''
    this.type = this.getAttribute('type') || 'text'
    this.placeholder = this.getAttribute('placeholder') || ''
    this.value = this.getAttribute('value') || ''
    this.maxlength = this.getAttribute('maxlength')
    this.max = this.getAttribute('max')
    this.min = this.getAttribute('min')
    this.inputmode = this.getAttribute('inputmode')
    this.attachShadow({ mode: 'open' })
  }

  get oninput () {
    return this.input ? this.input.oninput : null
  }

  set oninput (val) {
    if (this.input) {
      this.input.oninput = val
    }
  }

  get onchange () {
    return this.input ? this.input.onchange : null
  }

  set onchange (val) {
    if (this.input) {
      this.input.onchange = val
    }
  }

  render () {
    const checkboxClass = this.type === 'checkbox'
      ? 'text-input__input-label_checkbox'
      : ''
    this.attrs = `type="${this.type}" name="${this.name}" placeholder="${this.placeholder}"
          value="${this.value}" ${this.maxlength ? 'maxLength="' + this.maxlength + '"' : ''} ${this.max ? 'max="' + this.max
        + '"' : ''} ${this.min ? 'min="' + this.min + '"' : ''} ${this.inputmode ? 'inputmode="' + this.inputmode + '"'
          : ''}`
    this.shadowRoot.innerHTML = html`
      <link rel="stylesheet" href="/public/components/__text-input/__text-input.css">
      <div class="text-input">
        <input class="text-input__input" ${this.attrs} />
        <div class="text-input__input-label ${checkboxClass}">
          <slot></slot>
        </div>
      </div>
      <slot name="hidden"></slot>
    `
    this.insertHiddenInput()
    this.input = this.shadowRoot.querySelector('.text-input__input')
  }

  connectedCallback () {
    this.render()
    const self = this
    this.input.oninput = () => {
      self.value = self.input.value
      self.lightInput.value = self.value
    }
  }

  insertHiddenInput () {
    if (this.lightInput) { return }
    this.innerHTML += html`
      <input slot="hidden" class="dummy-input" type="hidden" ${this.attrs}>
    `
    this.lightInput = this.querySelector('.dummy-input')

    // Add an observer for programmatic change value of the dummy input
    const self = this
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
          self.value = mutation.target.value
          self.input.value = self.value
        }
      }
    })
    this.observer.observe(this.lightInput, { attributes: true })
  }

  disconnectedCallback () {
    this.observer.disconnect()
  }

  attributeChangedCallback (attributeName, oldVal, newVal) {
    if (attributeName === 'value') {
      this.lightInput.value = newVal
      this.input.value = newVal
    }
  }

  static register () {
    window.customElements.define('text-input', this)
  }
}