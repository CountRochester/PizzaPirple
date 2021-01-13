# Simple PIZZA delivery app

## Features

  - Fully working internet shop backend
  - https support
  - Create, get data, update and delete users
  - You can login, logout and update the session
  - Provide hardcoded menu
  - You can create, update and delete shoping cart
  - After creating cart you can make payment (provide by stripe.com)
  - Email the result of transaction (provide by mailgun.com)
  - Automatic deleting expired tokens
  - ES6-code based on async/await 
  - Frendly web GUI
  - RESTful API
  - CLI
## Server setup
### Requirements
 - Node.JS v.14 and above
 - No additional packages required
 - You need to setup some environment variables (see below)
### Environment variables
 - PORT - number or string, of port of a server
 - HASHING_SECRET - string, to hash your passwords
 - USER_ID_LENGTH - number, is a length of user id (almost unique)
 - TOKEN_EXPIRES - number, ms - life-time of tokens
 - TOKEN_LENGTH - number, is a length of token id (almost unique)
 - WORKER_INTERVAL - number, ms - time interval of check the tokens are expired
 - CART_ID_LENGTH - number, is a length of cart id (almost unique)
 - PAYMENT_SECRET_KEY - string, secret key of stripe-account
 - PAYMENT_PATH - string, the path for creating payments (usualy '/v1/payment_intents')
 - PATMENT_CREATE_TOKEN - string, the path for getting the payment tokens (usualy '/v1/tokens')
 - PAYMENT_HOSTNAME - string, hostname of payment provider (api.stripe.com)
 - MAIL_SECRET_KEY - string, api-key of your mailgun account
 - MAIL_HOST - string, hostname of mail-provider (api.mailgun.net)
 - MAIL_PATH - string, the path for sending mails (/v3/YOUR_MAILGUN_ACCOUNT_DOMAIN/messages)
 - MAIL_SERVER_ADDRESS - string, address from the messages will send (mailgun@YOUR_MAILGUN_ACCOUNT_DOMAIN)
## API
### Creating a user

To create the new user you need to POST message to 'api/users'
Parameters of payload must be:
```sh
{
    "firstName": "John",
    "lastName": "Smith",
    "password": "myverysecretpassword",
    "address": "Sunny st. 55",
    "email": "my-mail@gmail.com",
    "tosAgreement": true
}
```
As a response you will recieve if ok:
```sh
{ status: 'Ok' }
```
or an error:
```sh
{ error: 'some error details' }
```
### Getting user data
**Login needed!**
To get the user data you need to GET message to 'api/users'
A parameter you need to send user's **email** in querry string
As a response you will recieve if ok:
```sh
{
    "firstName": "John",
    "lastName": "Smith",
    "address": "Sunny st. 55",
    "email": "my-mail@gmail.com",
    "tosAgreement": true
}
```
or an error:
```sh
{ error: 'some error details' }
```
### Update user data
**Login needed!**
To update the user data you need to PUT message to 'api/users'
Parameters of payload must be:
```sh
{
    "firstName": "John",
    "lastName": "Smith",
    "password": "myverysecretpassword",
    "address": "Sunny st. 55",
    "email": "my-mail@gmail.com",
    "tosAgreement": true
}
```
As a response you will recieve if ok:
```sh
{ status: 'Ok' }
```
or an error:
```sh
{ error: 'some error details' }
```

### Delete user data
**Login needed!**
To delete the user data you need to DELETE message to 'api/users'
A parameter you need to send user's **email** in querry string
As a response you will recieve if ok:
```sh
{ status: 'Ok' }
```
or an error:
```sh
{ error: 'some error details' }
```
### Login
To login you need to send POST message to 'api/tokens'
Parameter needed:
```sh
{
    "password": "myverysecretpassword",
    "email": "my-mail@gmail.com"
}
```
Responce if ok you will provide a token:
```sh
{
    "token": {
        "id": "EwxLRIB2NP9Q8ddlMKpelYOJpCYz3O",
        "email": "my-mail@gmail.com",
        "expires": 1604854731885
    }
}
```
or an error:
```sh
{ error: 'some error details' }
```
### Getting the token
To get existed token data you need to provide token **id** in querry string in GET message on 'api/tokens'
Responce if ok you will provide a token:
```sh
{
    "token": {
        "id": "EwxLRIB2NP9Q8ddlMKpelYOJpCYz3O",
        "email": "my-mail@gmail.com",
        "expires": 1604854731885
    }
}
```
or an error:
```sh
{ error: 'some error details' }
```
### Update the token
When updating the token the token expires parameter wil set to now plus TOKEN_EXPIRES timestamp
To update the token just send token **id** as a payload parameter in PUT message to 'api/tokens'
```sh
{
    "id": "EwxLRIB2NP9Q8ddlMKpelYOJpCYz3O"
}
```
Responce if ok you will be:
```sh
{ status: 'Ok' }
```
or an error:
```sh
{ error: 'some error details' }
```
### Logout
Logging out is performed by sending token **id** parameter in querry string to 'api/tokens'
Responce if ok you will be:
```sh
{ status: 'Ok' }
```
or an error:
```sh
{ error: 'some error details' }
```
### Getting menu
**Login needed!**
To get a menu by any **category** or by **id** of menu item you need to send one of the parameter in querry string to 'api/menu'
Responce if ok you will be:
```sh
{
    "menu": [
        {
            "id": "1",
            "category": "mains",
            "name": "Vegan Mezze Romana",
            "description": "Smoked chilli chargrilled aubergine, sundried tomato harissa, jalapeno and Roquito peppers, finished with rocket and creamy humous on a Romana base. Also available on a gluten-free base.",
            "price": 5.55
        },
        {
            "id": "2",
            "category": "mains",
            "name": "Margherita Bufala",
            "description": "Buffalo mozzarella, tomato, fresh basil, fresh tomato, garlic oil and oregano, finished with fresh basil and extra virgin olive oil on a Romana base. Also available on a gluten-free base.",
            "price": 4.5
        }
    ]
}
```
or an error:
```sh
{ error: 'some error details' }
```
### Create or update the user's cart
**Login needed!**
To create or update user's cart you need to provide **items** array of menu items ids as a payload in POST message to 'api/cart'
```sh
{
    "items": ["1", "14", "22"]
}
```
Responce if ok you will be:
```sh
{
    "message": "New cart successfully added to user my-mail@gmail.com"
}
```
or an error:
```sh
{ error: 'some error details' }
```
### Get user's cart
**Login needed!**
To get user's cart items just send GET message to 'api/cart' without parameters
Responce if ok you will be:
```sh
{
    "id": "NpCt5KCskCiaQGGaxnJc",
    "email": "my-mail@gmail.com",
    "items": [
        {
            "id": "1",
            "category": "mains",
            "name": "Vegan Mezze Romana",
            "description": "Smoked chilli chargrilled aubergine, sundried tomato harissa, jalapeno and Roquito peppers, finished with rocket and creamy humous on a Romana base. Also available on a gluten-free base.",
            "price": 5.55
        },
        {
            "id": "14",
            "category": "starters",
            "name": "Vegan Dough Balls 'PizzaExpress'",
            "description": "A PizzaExpress classic, served with your choice of houmous or smoky tomato harissa.",
            "price": 1.85
        },
        {
            "id": "22",
            "category": "drinks",
            "name": "Meantime Anytime IPA",
            "description": "Anytime IPA (ABV 4.7%).",
            "price": 2.95
        }
    ],
    "total": 1035
}
```
or an error:
```sh
{ error: 'some error details' }
```
*Note: total parameter measured in cents*
### Delete user`s cart
**Login needed!**
To delete user's cart just send DELETE message to 'api/cart' without parameters
Responce if ok you will be:
```sh
{ message: 'User`s cart successfully deleted' }
```
or an error:
```sh
{ error: 'some error details' }
```
### Make the order and payment
**Login needed!**
To perform an order and a payment (cart must be created before) send POST message to 'api/order' with listed payload (you need to specify the card parameters):
```sh
{
    "card": {
        "number": "5555555555554444",
        "exp_month": 11,
        "exp_year": 2025,
        "cvc": 555
    }
}
```
Responce if ok you will be:
```sh
{
    "message": "Your payment 10.35 successfully accepted"
}
```
or an error:
```sh
{ error: 'some error details' }
```
When the payment completed the user will recieve the email with the order details and result of transaction
