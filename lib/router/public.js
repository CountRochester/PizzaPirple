import path from 'path'
import helpers from '../helpers.js'
import { errorPage } from './root.js'

export default {
  async favicon (data) {
    try {
      if (data.method !== 'get') {
        return {
          statusCode: 405,
          payload: { message: 'Method Not Allowed' }
        }
      }
      const favicon = await helpers.getStaticAsset('favicon.ico')
      return {
        statusCode: 200,
        payload: favicon,
        contentType: 'favicon'
      }
    } catch (err) {
      return {
        statusCode: 404,
        payload: errorPage(err),
        contentType: 'html'
      }
    }
  },
  async default (data) {
    try {
      if (data.method !== 'get') {
        return {
          statusCode: 405,
          payload: { message: 'Method Not Allowed' }
        }
      }
      const trimmedAssetName = data.trimmedPath.replace('public/', '')
      if (!trimmedAssetName.length) {
        return {
          statusCode: 404,
          payload: errorPage(err),
          contentType: 'html'
        }
      }
      const asset = await helpers.getStaticAsset(trimmedAssetName)
      const extention = path.extname(trimmedAssetName).replace('.', '')
      let contentType = 'plain'
      const avalibleExtName = ['png', 'jpg', 'css', 'js']
      if (extention === 'ico') {
        contentType = 'favicon'
      } else if (avalibleExtName.includes(extention)) {
        contentType = extention
      }
      return {
        statusCode: 200,
        payload: asset,
        contentType
      }
    } catch (err) {
      return {
        statusCode: 500,
        payload: errorPage(err),
        contentType: 'html'
      }
    }
  }
}