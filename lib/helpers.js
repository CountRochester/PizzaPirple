import crypto from 'crypto'
import config from './config.js'
import path from 'path'
import fs from 'fs'

const rootDir = path.resolve(path.parse('').dir)

export default {
  hash (str) {
    if (typeof str === 'string' && str.length) {
      return crypto.createHmac('sha256', config.HASHING_SECRET).update(str).digest('hex')
    } else {
      return
    }
  },

  parseJsonToObject (str) {
    try {
      if (typeof str === 'string' && str.length) {
        return JSON.parse(str)
      }
    } catch (err) {
      console.error(err)
    }

  },

  validateText (str) {
    if (typeof str === 'string') {
      if (str.trim().length) { return str.trim() }
    }
  },

  validateBool (value) {
    if (typeof value === 'boolean' && value) { return true }
    return false
  },

  validateTos (value) {
    if (value === 'agree' || value === 'true' || value === true) { return true }
    return false
  },

  createRandomString (strLength) {
    strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false
    if (!strLength) { return }
    const possibleCaracters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_'
    let i = 0
    let outputString = ''
    while (i++ < strLength) {
      outputString += possibleCaracters[Math.floor(Math.random() * possibleCaracters.length)]
    }
    return outputString
  },

  getStaticAsset (file) {
    return new Promise((resolve, reject) => {
      if (!file || typeof file !== 'string') {
        reject('Invalid file name')
      } else {
        const filePath = path.join(rootDir, 'public')
        fs.readFile(`${filePath}/${file}`, (err, str) => {
          if (err) {
            reject('Unable to read template file')
          } else {
            resolve(str)
          }
        })
      }
    })
  },

  get24h () {
    const now = Date.now()
    return {
      start: +now - 1000 * 60 * 60 * 24,
      end: +now
    }
  },

  getToday () {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth()
    const year = now.getFullYear()
    const today = new Date(year, month, day, 0, 0, 0)
    return {
      start: +today,
      end: +now
    }
  },

  getWeek () {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth()
    const year = now.getFullYear()
    const today = new Date(year, month, day, 0, 0, 0)
    const dayWeek = now.getDay() || 7
    const weekStart = +today - 1000 * 60 * 60 * 24 * (dayWeek - 1)
    return {
      start: +weekStart,
      end: +now
    }
  },

  getMonth () {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const monthStart = new Date(year, month, 1, 0, 0, 0)
    return {
      start: +monthStart,
      end: +now
    }
  },

  getYear () {
    const now = new Date()
    const year = now.getFullYear()
    const yearStart = new Date(year, 0, 1, 0, 0, 0)
    return {
      start: +yearStart,
      end: +now
    }
  }
}