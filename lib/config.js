import devConfig from './config-dev.js'
import prodConfig from './config-prod.js'
const mode = process.env.NODE_ENV?.trim()
export default mode === 'development' ? devConfig : prodConfig