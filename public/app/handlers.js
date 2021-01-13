const successMessages = {
  accountEdit: 'Account data successfully changed',
  passwordEdit: 'Password successfully changed'
}

export function handleResponceError (responce, output) {
  if (responce.status === 200) { return }

  const errorMessage = output.error || responce.statusText || 'Sorry, an error has occured. Please try again.'
  const error = new Error(errorMessage)
  error.code = responce.status

  throw error
}

export function formRequestUrl (path, queryStringObject) {
  let requestUrl = path
  let counter = 0

  for (const queryKey in queryStringObject) {
    if (!queryStringObject.hasOwnProperty(queryKey)) { continue }
    counter++
    if (counter > 1) {
      requestUrl += '&'
    } else {
      requestUrl += '?'
    }
    requestUrl += `${queryKey}=${queryStringObject[queryKey]}`
  }
  return requestUrl
}

export function loadDataOnAccountEditForm (userResult) {
  const form = document.getElementById('accountEdit')
  if (!form) { return }

  const elements = getFormElements(form)
  console.log(elements)
  elements.forEach(element => writeElementValueFromPayload(userResult, element))
}

function writeElementValueFromPayload (userResult, element) {
  if (element.type === 'submit') { return }

  const data = userResult.payload[element.name]
  if (!data) { return }

  element.value = data
}

export function loadEmailOnForm (email, formId) {
  const form = document.getElementById(formId)
  if (!form) { return }

  const elements = getFormElements(form)
  elements.forEach((element) => {
    if (element.name === 'email') {
      element.value = email
    }
  })
}

export function handlePasswordRetype (passwordInput, passwordRetype, form) {
  return () => {
    try {
      processPasswordEnter(passwordInput, passwordRetype, form)
    } catch (err) {
      const error = err.message || 'An error has occured, please try again'
      showMessageOnForm(form, 'formError', error)
    }
  }
}

function processPasswordEnter (passwordInput, passwordRetype, form) {
  passwordRetype.pattern = `^${passwordInput.value}$`
  hideAllFormMessages(form)
  if (!passwordRetype.checkValidity()) {
    throw new Error('Passwords do not match')
  }
}

export async function formHandler (ev, form, app, redirect, timeout) {
  ev.preventDefault()

  const path = form.action
  const method = getFormMethod(form)

  hideAllFormMessages(form)

  const payload = formPaiload(form)

  const queryStringObject = method === 'DELETE' ? payload : {}
  try {
    await processForm(app, { path, method, queryStringObject, payload, form })
    if (redirect) {
      setTimeout(() => {
        window.location = redirect
      }, timeout)
    }
  } catch (err) {
    const error = err.message || 'An error has occured, please try again'
    showMessageOnForm(form, 'formError', error)
  }
}

async function processForm (app, { path, method, queryStringObject, payload, form }) {
  if (!form.checkValidity()) {
    throw new Error('Invalid inputs')
  }
  const result = await app.client.request({ path, method, queryStringObject, payload })
  if (result.statusCode !== 200) {
    if (result.statusCode === 403) {
      app.logUserOut()
    } else {
      const message = result.payload.error || 'An error has occured, please try again'
      throw new Error(message)
    }
  } else {
    showMessageOnForm(form, 'formSuccess', successMessages[form.id] || result.payload.message)
    await app.formResponseProcessor(form, payload, result.payload)
  }
}

export function showMessageOnForm (form, classElement, message) {
  const element = getFormElement(form, classElement)
  if (element) {
    element.innerHTML = message
    element.style.display = 'block'
  }
}

function hideAllFormMessages (form) {
  hideFormChildElement(form, 'formError')
  hideFormChildElement(form, 'formSuccess')
}

function hideFormChildElement (form, elementClass) {
  const element = getFormElement(form, elementClass)
  element ? element.style.display = 'none' : null
}

function getFormElement (form, elementClass) {
  return form.querySelector(`#${form.id} .${elementClass}`)
}

function formPaiload (form) {
  let payload = {}

  const elements = getFormElements(form)

  elements.forEach(element => processElement(element, payload))

  return payload
}

function getFormElements (form) {
  const elements = form.elements
  return Array.from(elements)
}

function processElement (element, payload) {
  if (element.type === 'submit') { return }
  const valueOfElement = getValueOfElement(element)
  const nameOfElement = getElementName(element)

  if (isElementMethod(element)) { return }
  if (isMultiselect(element)) {
    processMultiselect(payload, element)
  } else {
    payload[nameOfElement] = valueOfElement
  }
}

function isElementMethod (element) {
  const nameOfElement = getElementName(element)
  return nameOfElement === '_method'
}

function getFormMethod (form) {
  const elements = getFormElements(form)
  let method

  elements.forEach((element) => {
    const valueOfElement = getValueOfElement(element)
    if (isElementMethod(element)) {
      method = valueOfElement.toUpperCase()
    }
  })

  return method || form.method.toUpperCase()
}

function getClassOfElement (element) {
  return element.classList.value || ''
}

function getValueOfElement (element) {
  return isElementCheckbox(element) && !isMultiselect(element)
    ? isElementChecked(element)
    : getElementValue(element)
}

function isMultiselect (element) {
  const classOfElement = getClassOfElement(element)
  return classOfElement.includes('multiselect')
}

function isElementCheckbox (element) {
  return element.type === 'checkbox'
}

function isElementChecked (element) {
  return element.checked
}

function getElementValue (element) {
  const classOfElement = getClassOfElement(element)
  return classOfElement.includes('intval')
    ? +element.value
    : element.value
}

function getElementName (element) {
  return element.name
}

function isArray (arr) {
  return Object.prototype.toString.call(arr) === '[object Array]'
}

function processMultiselect (payload, element) {
  if (!isElementChecked(element)) { return }

  const valueOfElement = getValueOfElement(element)
  const nameOfElement = getElementName(element)

  payload[nameOfElement] = isArray(payload[nameOfElement])
    ? payload[nameOfElement]
    : []

  payload[nameOfElement].push(valueOfElement)
}

export function inputOnlyDigits (element) {
  return ({ data }) => {
    let val = element.lightInput.value.replace(/ /g, '')
    if ('0123456789'.includes(data)) {
      val += data
    } else if (data === null) {
      val = val.slice(0, val.length - 1)
    }
    element.lightInput.value = val
  }
}

export function inputOnlyDigitsMinMax (element, minVal, maxVal) {
  return () => {
    let val = element.lightInput.value.replace(/ /g, '')
    val = +val
    if (val > maxVal) { val = maxVal }
    else if (val < minVal) { val = minVal }
    const outputValue = val < 10
      ? '0' + val.toString()
      : val.toString()
    element.lightInput.value = outputValue
  }
}
