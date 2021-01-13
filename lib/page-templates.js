import path from 'path'
import fs from 'fs/promises'
import config from './config.js'
import _data from './data.js'
import { ServerError } from './error.js'

const rootDir = path.resolve(path.dirname(''))
const pagesPath = path.join(rootDir, 'pages')
const layoutPath = path.join(pagesPath, 'layout')
const templatePath = path.join(pagesPath, 'templates')



const pageTemplates = {
  async getTemplate (templateName) {
    const template = await this.loadHtml(templateName, templatePath)
    return this.loadString(template)
  },

  async loadHtml (fileName, dirName) {
    if (!fileName) {
      throw new ServerError(400, 'No file name entered')
    }
    if (!dirName) {
      throw new ServerError(400, 'No directory name entered')
    }
    try {
      const fileContent = await fs.readFile(`${dirName}/${fileName}.html`, { encoding: 'utf-8' })
      return fileContent
    } catch (err) {
      ServerError.throw(err)
    }
  },

  async loadLayout (layoutName) {
    const layout = await this.loadHtml(layoutName, layoutPath)
    return this.loadString(layout)
  },

  async loadPage (pageName) {
    const page = await this.loadHtml(pageName, pagesPath)
    return this.loadString(page)
  },

  async formPage (layoutName, pageName, data, pageStr) {
    const layout = await this.loadLayout(layoutName, data)
    let outputHtml = layout.str
    if (layout.keys.length) {
      for (const keyName of layout.keys) {
        if (keyName !== 'main') {
          const keyTemplate = await this.getTemplate(`_${keyName}`)
          const interpolatedTemplate = this.interpolate(keyTemplate, data)
          outputHtml = outputHtml.replace(`{${keyName}}`, interpolatedTemplate.str)
        }
      }
    }
    const main = pageName ? await this.loadPage(pageName) : pageStr
    const interpolatedPage = this.interpolate(main, data)
    outputHtml = outputHtml.replace('{main}', interpolatedPage.str)
    return outputHtml
  },

  loadString (strInput) {
    const str = typeof strInput === 'string' && strInput.length ? strInput : ''
    const keys = str.match(/(?<=\{)([\s\S]+?)(?=\})/gm) || []
    return { str, keys }
  },

  interpolate (stringObject, data) {
    stringObject = typeof stringObject === 'object'
      ? stringObject
      : { str: '', keys: [] }
    data = typeof data === 'object' && data ? data : {}
    const output = { ...stringObject }
    stringObject.keys.forEach((key) => {
      const find = `{${key}}`
      if (key.includes('global.')) {
        const globalKey = key.replace('global.', '')
        if (config.TEMPLATE_GLOBALS.hasOwnProperty(globalKey) && typeof config.TEMPLATE_GLOBALS[globalKey] === 'string') {
          const replace = config.TEMPLATE_GLOBALS[globalKey]
          output.str = output.str.replace(find, replace)
          output.keys = output.keys.filter(el => el !== key)
        }
      } else if (data.hasOwnProperty(key) && (typeof data[key] === 'string' || typeof data[key] === 'number')) {
        const replace = data[key]
        output.str = output.str.replace(find, replace)
        output.keys = output.keys.filter(el => el !== key)
      }
    })
    return output
  },

  async formMenuPage (data, category) {
    const avalibleCategory = ['mains', 'starters', 'desserts', 'drinks']
    category = avalibleCategory.includes(category) ? category : 'mains'
    const menu = await _data.read('', 'menu')
    if (!menu) {
      throw new ServerError(500, 'Unable to read menu')
    }
    const categoryMenu = menu.items.filter(el => el.category === category)
    let categoryContent = ''
    categoryMenu.forEach((item) => {
      categoryContent += `<menu-item item-id="${item.id}" name="${item.name}" description="${item.description}" price="${item.price}" pic="${item.pic}"></menu-item>`
    })
    const page = await this.loadPage('menu')
    const main = this.interpolate(page, { categoryContent })
    const output = await this.formPage('default', null, data, main)
    return output
  }
}

export default pageTemplates