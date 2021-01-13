import _data from '../data.js'
import helpers from '../helpers.js'
import { ServerError } from '../error.js'

// Function that return linked entity
// propName - property name of the primary key
// EntityClass - class of the linked entity
export async function getLinkedEntity (propName, EntityClass) {
  if (this[propName]) {
    return await EntityClass.findOne(this[propName])
  }
}

export class Entity {
  constructor(typeName, primaryKey) {
    this.typeName = typeName
    this.primaryKey = primaryKey
    this.protectedFromSaveToFileKeys = ['typeName', 'primaryKey', 'privateKeys', 'protectedFromSaveToFileKeys']
    this.privateKeys = []
  }

  _formData () {
    const data = {}
    for (const key in this) {
      if (typeof this[key] !== 'function' && !this.protectedFromSaveToFileKeys.includes(key)) {
        data[key] = this[key]
      }
    }
    return data
  }

  getData () {
    const restrictedKeys = [...this.privateKeys, ... this.protectedFromSaveToFileKeys]
    const data = {}
    for (const key in this) {
      if (typeof this[key] !== 'function' && !restrictedKeys.includes(key)) {
        data[key] = this[key]
      }
    }
    return data
  }

  async save () {
    const currentData = this._formData()
    const data = await _data.update(this.typeName, this[this.primaryKey], currentData)
    if (!data) {
      throw new ServerError(404, `Unable to save ${this.typeName}`, 'json')
    }
    return data
  }

  async delete () {
    await _data.delete(this.typeName, this[this.primaryKey])
  }

  static create () {
    throw new Error('The static method create is not implemented')
  }

  static async findOne (pkey, validateFunction) {
    const validator = validateFunction || helpers.validateText
    pkey = validator(pkey)
    const entity = new this()
    if (!pkey) {
      throw new ServerError(400, `Invalid ${entity.primaryKey}`, 'json')
    }
    const itemData = await _data.read(entity.typeName, pkey)
    if (!itemData) { return }
    for (const key in itemData) {
      entity[key] = itemData[key]
    }
    return entity
  }

  static async findAll (handler) {
    const entity = new this()
    const itemIds = await _data.list(entity.typeName)
    const fun = handler || this.findOne
    const output = []
    const items = itemIds.map(id => fun.call(this, id))
    for await (const item of items) {
      if (item) {
        output.push(item)
      }
    }
    return output
  }
}
