export default {
  PORT: process.env.PORT || 3000,
  HASHING_SECRET: process.env.HASHING_SECRET || 'kjskj3u8c89-dkjh4 kjsdhdk3885*ffd__dkj+lkdkl kdk2q[pz,d',
  USER_ID_LENGTH: process.env.USER_ID_LENGTH || 20,
  TOKEN_EXPIRES: process.env.TOKEN_EXPIRES || 1000 * 60 * 60,
  TOKEN_LENGTH: process.env.TOKEN_LENGTH || 30,
  WORKER_INTERVAL: process.env.WORKER_INTERVAL || 1000 * 60 * 60,
  CART_ID_LENGTH: process.env.CART_ID_LENGTH || 20,
  PAYMENT_SECRET_KEY: process.env.PAYMENT_SECRET_KEY,
  PAYMENT_PATH: process.env.PAYMENT_PATH || '/v1/payment_intents',
  PATMENT_CREATE_TOKEN: process.env.PATMENT_CREATE_TOKEN || '/v1/tokens',
  PAYMENT_HOSTNAME: process.env.PAYMENT_HOSTNAME || 'api.stripe.com',
  MAIL_SECRET_KEY: process.env.MAIL_SECRET_KEY,
  MAIL_HOST: process.env.MAIL_HOST || 'api.mailgun.net',
  MAIL_PATH: process.env.MAIL_PATH,
  MAIL_SERVER_ADDRESS: process.env.MAIL_SERVER_ADDRESS,
  TEMPLATE_GLOBALS: {
    appName: 'PIZZA delivery online',
    companyName: 'PIZZA corp',
    yearCreated: '2020',
    baseUrl: `https://localhost:3000`
  }
}
