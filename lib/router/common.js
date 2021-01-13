import helpers from '../helpers.js'
import { Token } from '../orm/index.js'
import { ServerError } from '../error.js'

export async function checkToken (data) {
  const tokenId = helpers.validateText(data.headers.token)
  if (!tokenId) {
    throw new ServerError(401, 'Access denined')
  }
  try {
    const token = await Token.readAndCheckToken(tokenId)
    if (!token) {
      throw new ServerError(403, 'Access denined')
    }
    return {
      statusCode: 200,
      payload: token
    }
  } catch (err) {
    throw err
  }
}