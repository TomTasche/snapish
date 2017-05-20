(function () {
  var fetch = window.fetch

  function fetchFacebookFeed () {
    var options = {}
    options.credentials = 'same-origin'

    var promise = fetch('/facebook/feed', options)
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

  window.ServerBridge = bridge
})()
