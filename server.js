'use strict'

var Url = require('url')

var Express = require('express')
var Session = require('express-session')

var Facebook = require('fb')

var PORT = process.env.PORT || 8080
var PROTOCOL = process.env.PROTOCOL || 'http'
var HOST = process.env.HOST || 'localhost'

var FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET

Facebook.options({
  appId: FACEBOOK_CLIENT_ID,
  appSecret: FACEBOOK_CLIENT_SECRET
})

function initializeServer () {
  let app = Express()

  app.use(Express.static('public'))

  app.use(Session({
    secret: 'tomtascheRockz',
    resave: false,
    saveUninitialized: true
  }))

  app.get('/facebook/login', onFacebookLoginRequest)
  app.get('/facebook/feed', onFacebookFeedRequest)

  app.listen(PORT, function () {
    console.log('server is running')
  })
}

function onFacebookLoginRequest (request, response) {
  let urlObject = Url.parse(request.url, true)

  let accessCode = urlObject.query.code
  if (!accessCode) {
    let loginUrl = Facebook.getLoginUrl({
      redirect_uri: getRedirectUrl(request)
    })

    let responseHeaders = {}
    responseHeaders['Location'] = loginUrl

    response.writeHead(302, responseHeaders)
    response.end()
  } else {
    // we have to explicitly pass the client credentials here for some reason
    let options = {
      client_id: FACEBOOK_CLIENT_ID,
      client_secret: FACEBOOK_CLIENT_SECRET,
      redirect_uri: getRedirectUrl(request),
      code: accessCode
    }

    var promise = Facebook.api('oauth/access_token', options)
    promise.then(function (facebookResponse) {
      var accessToken = facebookResponse.access_token
      request.session.facebookAccessToken = accessToken

      let responseHeaders = {}
      responseHeaders['Location'] = '/#facebook-logged-in'

      response.writeHead(302, responseHeaders)
      response.end()
    })
    promise.catch(function (error) {
      console.error(error)

      response.statusCode = 500
      response.end()
    })
  }
}

function onFacebookFeedRequest (request, response) {
  let options = {
    fields: ['message', 'type', 'source', 'link'],
    access_token: request.session.facebookAccessToken
  }

  var promise = Facebook.api('/DAZNDE/posts', options)
  promise.then(function (facebookResponse) {
    let responseArray = []

    for (let post of facebookResponse.data) {
      if (post.type !== 'video') {
        continue
      }

      responseArray.push(post)
    }

    response.end(JSON.stringify(responseArray))
  })
  promise.catch(function (error) {
    console.error(error)

    response.statusCode = 500
    response.end()
  })
}

function getRedirectUrl (request) {
  let url = PROTOCOL + '://' + HOST + ':' + PORT + '/facebook/login'
  url += '?session=' + request.session.id

  return url
}

initializeServer()
