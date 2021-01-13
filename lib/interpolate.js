import path from 'path'
import fs from 'fs/promises'
import config from './config.js'

const baseDir = path.resolve(path.dirname(''))
const componentPath = path.join(baseDir, 'components')
const componentRegEx = /(?<=<component>)([\s\S]+?)(?=<\/component>)/gm
const componentReplaceRegEx = /(?:<component>)([\s\S]+?)(?:<\/component>)/gm
const parameterRegEx = /(?<=\{)([\s\S]+?)(?=\})/gm

export default {
  async interpolate (stringObject, data) {
    stringObject = typeof stringObject === 'object'
      ? stringObject
      : { str: '', parameters: [], components: [] }
    data = typeof data === 'object' && data ? data : {}
    const output = this.interpolateParams(stringObject, data)
    console.log(output)
    try {
      await this.interpolateComponents(output)
      return output
    } catch (err) {
      throw err
    }
  },
  interpolateParams (stringObject, data) {
    const output = { ...stringObject }
    stringObject.parameters.forEach((key) => {
      const find = `{${key}}`
      if (key.includes('global.')) {
        const globalKey = key.replace('global.', '')
        if (config.TEMPLATE_GLOBALS.hasOwnProperty(globalKey) && typeof config.TEMPLATE_GLOBALS[globalKey] === 'string') {
          const replace = config.TEMPLATE_GLOBALS[globalKey]
          output.str = output.str.replace(find, replace)
          output.parameters = output.parameters.filter(el => el !== key)
        }
      } else if (data.hasOwnProperty(key) && (typeof data[key] === 'string' || typeof data[key] === 'number')) {
        const replace = data[key]
        output.str = output.str.replace(find, replace)
        output.parameters = output.parameters.filter(el => el !== key)
      }
    })
    return output
  },
  async interpolateComponents (stringObject) {
    try {
      for (const componentName of stringObject.components) {
        const component = await this.loadComponent(componentName)
        stringObject.str = stringObject.str.replace(componentReplaceRegEx, component)
      }
    } catch (err) {
      throw err
    }
  },
  async loadComponent (componentName) {
    try {
      const cPath = path.join(componentPath, `__${componentName}.html`)
      const component = await fs.readFile(cPath, { encoding: 'utf-8' })
      return component
    } catch (err) {
      throw err
    }
  },
  loadString (strInput) {
    const stringValid = typeof strInput === 'string' && strInput.length
    const str = stringValid ? strInput : ''
    const components = str.match(componentRegEx) || []
    const parameters = str.match(parameterRegEx) || []
    return { str, parameters, components }
  }
}