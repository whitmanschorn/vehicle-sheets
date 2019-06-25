
# RUHE Group Backend

This repo describes a set of node microservices used by the [RUHE Group Frontend](https://github.com/whitmanschorn/ruhe-frontend). Each service is hosted by AWS Lambda. 

To get started, install [The Serverless Framework](https://serverless.com/framework/), then install the lone NPM dependency

```
npm install
``` 

To run tests:

```
npm run test
```

To lint code

```
npm run eslint
```

## Debugging

Mostly, you should use serverless to run each service locally and develop/test that way. However, if you’re trying to resolve what happened to a deployed instance, you’ll need an AWS login with the RUHE account. Then, you can head to the cloud watch logs page and find each service’s logs. 

### Deploy

We deploy via serverless

```
serverless deploy
```

To deploy to different environments, set the provider -> stage setting in serverless.yml

## Configuration

We keep configuration variables in `secrets.json`. Example:

```javascript
{
  "stripeSecretKey": "sk_test_123"
}
```

## Thanks

Based on **serverless-stripe-backend** © 2017+, Yos Riady. Released under the [MIT] License.<br>
Authored and maintained by Yos Riady with help from contributors ([list][contributors]).

> [yos.io](http://yos.io) &nbsp;&middot;&nbsp;
> GitHub [@yosriady](https://github.com/yosriady)

[MIT]: http://mit-license.org/
[contributors]: http://github.com/yosriady/serverless-stripe-backend/contributors
