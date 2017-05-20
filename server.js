'use strict'

var Url = require('url')

var Express = require('express')
var Session = require('express-session')

var Facebook = require('fb')

var PORT = process.env.PORT || 8080
var HOST = process.env.HOST || 'localhost'

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
      client_id: '432576567116772',
      client_secret: '79956649d248e3fcb37e961f22732780',
      redirect_uri: getRedirectUrl(request)
    })

    let responseHeaders = {}
    responseHeaders['Location'] = loginUrl

    response.writeHead(302, responseHeaders)
    response.end()
  } else {
    let options = {
      client_id: '432576567116772',
      client_secret: '79956649d248e3fcb37e961f22732780',
      redirect_uri: getRedirectUrl(request),
      code: accessCode
    }

    Facebook.api('oauth/access_token', options, function (facebookResponse) {
      if (!facebookResponse || facebookResponse.error) {
        console.log(!facebookResponse ? 'error occurred' : facebookResponse.error)

        response.statusCode = 500
        response.end()

        return
      }

      var accessToken = facebookResponse.access_token
      request.session.facebookAccessToken = accessToken

      let responseHeaders = {}
      responseHeaders['Location'] = '/#facebook-logged-in'

      response.writeHead(302, responseHeaders)
      response.end()
    })
  }
}

function onFacebookFeedRequest (request, response) {
  let options = {
    fields: ['message', 'type', 'source', 'link'],
    access_token: request.session.facebookAccessToken
  }

  Facebook.api('/DAZNDE/posts', options, function (facebookResponse) {
    if (!facebookResponse || facebookResponse.error) {
      console.log(!facebookResponse ? 'error occurred' : facebookResponse.error)

      response.statusCode = 500
      response.end()

      return
    }

    let responseArray = []

    for (let post of facebookResponse.data) {
      if (post.type !== 'video') {
        continue
      }

      responseArray.push(post)
    }

    response.end(JSON.stringify(responseArray))
  })
}

function getRedirectUrl (request) {
  let url = 'http://' + HOST + ':' + PORT + '/facebook/login'
  url += '?session=' + request.session.id

  return url
}

initializeServer()
