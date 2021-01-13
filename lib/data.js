import fs from 'fs/promises'
import path from 'path'
import helpers from './helpers.js'
import { ServerError } from './error.js'

export default {
  baseDir: path.join(path.resolve(path.dirname('')), './.data'),
  async create (dir, file, data) {
    try {
      const fileDescriptor = await fs.open(`${this.baseDir}/${dir}/${file}.json`, 'w+')
      await fs.writeFile(fileDescriptor, JSON.stringify(data))
      return await this.read(dir, file)
    } catch (err) {
      ServerError.throw(err)
    }
  },

  async read (dir, file) {
    const fileAddress = dir !== ''
      ? `${this.baseDir}/${dir}/${file}.json`
      : `${this.baseDir}/${file}.json`
    try {
      const fileContent = await fs.readFile(fileAddress, 'utf-8')
      return fileContent ? helpers.parseJsonToObject(fileContent) : null
    } catch (err) {
      if (err.errno === -4058) { return }
      ServerError.throw(err)
    }
  },

  async update (dir, file, data) {
    try {
      const filePath = `${this.baseDir}/${dir}/${file}.json`
      const fileDescriptor = await fs.open(filePath, 'r+')
      await fs.truncate(filePath)
      await fs.writeFile(fileDescriptor, JSON.stringify(data))
      return await this.read(dir, file)
    } catch (err) {
      console.error(`Error updating the file ${file}.json`)
      ServerError.throw(err)
    }
  },

  async delete (dir, file) {
    try {
      await fs.unlink(`${this.baseDir}/${dir}/${file}.json`)
    } catch (err) {
      console.error(`Error deleting the file ${file}.json`)
      ServerError.throw(err)
    }
  },

  async list (dir, extention) {
    try {
      const fileNames = await fs.readdir(`${this.baseDir}/${dir}/`)
      return fileNames.map(fileName => fileName.replace(extention ? extention : '.json', ''))
    } catch {
      ServerError.throw(err)
    }
  }
}