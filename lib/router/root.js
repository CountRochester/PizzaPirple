import pageTemplate from '../page-templates.js'

export const errorPage = (err) => `
        <html>
          <body>
            <h1>INTERNAL SERVER ERROR</h1>
            <p>${err}</p>
          </body>
        </html>
        `

export default (data) => {
  return new Promise((resolve, reject) => {
    if (data.method !== 'get') {
      reject(405, undefined, 'html')
    } else {
      const templateData = {
        'head.title': 'Uptime monitoring',
        'head.description': 'This is meta description',
        'body.class': 'index'
      }
      pageTemplate.getTemplate('index', data, (err, str) => {
        if (err) {
          reject(500, errorPage(err), 'html')
        } else {
          pageTemplate.addUniversalTemplates(str, data, (err, almostOutputString) => {
            if (err) {
              reject(500, errorPage(err), 'html')
            } else {
              const outputString = pageTemplate.interpolate(almostOutputString, templateData)
              resolve(200, outputString, 'html')
            }
          })
        }
      })
    }
  })
}