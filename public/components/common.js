export const html = (str, ...attrs) => str.reduce((acc, line, index) => acc += line + (attrs[index] || ''), '')
