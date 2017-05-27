(function () {
  var fetch = window.fetch

  function fetchFacebookFeed () {
    var promise = fetchFeed('/facebook/feed')
    return promise
  }

  function fetchTwitterFeed () {
    var promise = fetchFeed('/twitter/feed')
    return promise
  }

  function fetchFeed (url) {
    var options = {}
    options.credentials = 'same-origin'

    var promise = fetch(url, options)
    promise = promise.then(function (response) {
      if (!response.ok) {
        throw new Error('request failed')
      }

      return response.json()
    })

    return promise
  }

  var bridge = {}
  bridge.fetchFacebookFeed = fetchFacebookFeed
  bridge.fetchTwitterFeed = fetchTwitterFeed

  window.ServerBridge = bridge
})()
