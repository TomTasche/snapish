'use strict'

var Url = require('url')

var Express = require('express')
var Session = require('express-session')

var Facebook = require('fb')
var Twitter = require('node-twitter-api')

var TYPE_FACEBOOK = 'facebook'
var TYPE_TWITTER = 'twitter'

var PORT = process.env.PORT || 8080
var PUBLIC_PORT = process.env.PUBLIC_PORT
var PROTOCOL = process.env.PROTOCOL || 'http'
var HOST = process.env.HOST || 'localhost'

var FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET

var TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
var TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET

Facebook.options({
  appId: FACEBOOK_CLIENT_ID,
  appSecret: FACEBOOK_CLIENT_SECRET
})

var twitter = new Twitter({
  consumerKey: TWITTER_CLIENT_ID,
  consumerSecret: TWITTER_CLIENT_SECRET,
  callback: getRedirectUrl(null, TYPE_TWITTER)
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

  app.get('/twitter/login', onTwitterLoginRequest)
  app.get('/twitter/feed', onTwitterFeedRequest)

  app.listen(PORT, function () {
    console.log('server is running')
  })
}

function onFacebookLoginRequest (request, response) {
  let urlObject = Url.parse(request.url, true)

  let accessCode = urlObject.query.code
  if (!accessCode) {
    let loginUrl = Facebook.getLoginUrl({
      redirect_uri: getRedirectUrl(request, TYPE_FACEBOOK)
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
      redirect_uri: getRedirectUrl(request, TYPE_FACEBOOK),
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

function onTwitterLoginRequest (request, response) {
  let urlObject = Url.parse(request.url, true)

  let oauthVerifier = urlObject.query.oauth_verifier
  if (!oauthVerifier) {
    twitter.getRequestToken(function (error, requestToken, requestTokenSecret, results) {
      if (error) {
        console.error(error)

        response.statusCode = 500
        response.end()

        return
      }

      request.session.twitter = {}
      request.session.twitter.requestToken = requestToken
      request.session.twitter.requestTokenSecret = requestTokenSecret

      let loginUrl = twitter.getAuthUrl(requestToken)

      let responseHeaders = {}
      responseHeaders['Location'] = loginUrl

      response.writeHead(302, responseHeaders)
      response.end()
    })
  } else {
    let requestToken = request.session.twitter.requestToken
    let requestTokenSecret = request.session.twitter.requestTokenSecret

    twitter.getAccessToken(requestToken, requestTokenSecret, oauthVerifier, function (error, accessToken, accessTokenSecret, results) {
      if (error) {
        console.error(error)

        response.statusCode = 500
        response.end()

        return
      }

      request.session.twitter.accessToken = accessToken
      request.session.twitter.accessTokenSecret = accessTokenSecret

      let responseHeaders = {}
      responseHeaders['Location'] = '/#twitter-logged-in'

      response.writeHead(302, responseHeaders)
      response.end()
    })
  }
}

function onTwitterFeedRequest (request, response) {
  let accessToken = request.session.twitter.accessToken
  let accessTokenSecret = request.session.twitter.accessTokenSecret

  let options = {
    screen_name: 'DAZN_DE'
  }

  twitter.getTimeline('user_timeline', options, accessToken, accessTokenSecret, function (error, data, twitterResponse) {
    if (error) {
      console.error(error)

      response.statusCode = 500
      response.end()
    } else {
      let responseArray = []

      for (let post of data) {
        let entities = post['extended_entities']
        if (!entities) {
          continue
        }

        let hasVideo = false
        for (let media of entities.media) {
          if (media.type === 'video') {
            hasVideo = true

            break
          }
        }

        if (hasVideo) {
          responseArray.push(post)
        }
      }

      response.end(JSON.stringify(responseArray))
    }
  })
}

function getRedirectUrl (request, type) {
  let url = PROTOCOL + '://' + HOST
  if (PUBLIC_PORT) {
    url += ':' + PUBLIC_PORT
  }
  url += '/' + type + '/login'

  if (request) {
    url += '?session=' + request.session.id
  }

  return url
}

initializeServer()
