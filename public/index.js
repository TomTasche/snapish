(function () {
  // redeclare dependencies to avoid linter-warnings
  var mdc = window.mdc
  var videojs = window.videojs

  var ServerBridge = window.ServerBridge

  var SnackComponent = window.SnackComponent

  var interactionStartedTimestap

  var playlist
  var currentPlaylistIndex
  var player

  var facebookLoginButton
  var twitterLoginButton
  var feedButton
  var snappyButton

  function initialize () {
    mdc.autoInit()

    SnackComponent.initialize()

    facebookLoginButton = document.querySelector('#facebook-login-button')
    facebookLoginButton.addEventListener('click', function () {
      window.location.href = '/facebook/login'
    })

    twitterLoginButton = document.querySelector('#twitter-login-button')
    twitterLoginButton.addEventListener('click', function () {
      window.location.href = '/twitter/login'
    })

    feedButton = document.querySelector('#download-feed-button')
    feedButton.addEventListener('click', fetchPlaylist)

    snappyButton = document.querySelector('#snappy-button')
    snappyButton.addEventListener('click', loadVideo)

    var currentHash = window.location.hash
    var isFacebookLoggedIn = currentHash === '#facebook-logged-in'
    var isTwitterLoggedIn = currentHash === '#twitter-logged-in'

    facebookLoginButton.disabled = isFacebookLoggedIn
    twitterLoginButton.disabled = isTwitterLoggedIn
    feedButton.disabled = !(isFacebookLoggedIn || isTwitterLoggedIn)

    // disable long-press menu (otherwise pausing doesnt work on mobile)
    // http://stackoverflow.com/a/28748222/198996
    window.oncontextmenu = function (event) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }

    initializeVideo()
  }

  function fetchPlaylist () {
    playlist = []

    currentPlaylistIndex = 0

    var currentHash = window.location.hash

    var promise
    if (currentHash === '#facebook-logged-in') {
      promise = ServerBridge.fetchFacebookFeed()
      promise.then(function (feed) {
        for (var i = 0; i < feed.length; i++) {
          var post = feed[i]

          var videoUrl = post.source
          playlist.push(videoUrl)
        }

        feedButton.disabled = true
        snappyButton.disabled = false
      })
    } else if (currentHash === '#twitter-logged-in') {
      promise = ServerBridge.fetchTwitterFeed()
      promise.then(function (feed) {
        for (var postIndex = 0; postIndex < feed.length; postIndex++) {
          var post = feed[postIndex]

          var entities = post['extended_entities']
          if (!entities) {
            continue
          }

          for (var mediaIndex = 0; mediaIndex < entities.media.length; mediaIndex++) {
            var media = entities.media[mediaIndex]
            if (media.type === 'video') {
              var variants = media['video_info']['variants']

              // last one is usually a .m3u8
              var videoUrl = variants[variants.length - 1].url
              playlist.push(videoUrl)
            }
          }
        }

        feedButton.disabled = true
        snappyButton.disabled = false
      })
    } else {
      console.error('what?')
    }

    promise.catch(function () {
      // facebook login probably expired - reload page without "logged-in"-hash
      window.location.hash = ''
      window.location.href = '/'
    })
  }

  function initializeVideo () {
    player = videojs('snappy-video')

    player.controls(false)
    player.preload(true)
    player.on('ended', onVideoEnded)
    player.on('mousedown', onInteractionStarted)
    player.on('mouseup', onInteractionEnded)
    player.on('touchstart', onInteractionStarted)
    player.on('touchend', onInteractionEnded)
  }

  function onInteractionStarted () {
    interactionStartedTimestap = new Date().getTime()

    player.pause()
  }

  function onInteractionEnded () {
    var nowTimestamp = new Date().getTime()

    var timestampDifference = nowTimestamp - interactionStartedTimestap
    if (timestampDifference < 1 * 1000) {
      var newTime = player.currentTime() + 5
      if (newTime >= player.duration()) {
        onVideoEnded()

        return
      }

      player.currentTime(newTime)
    }

    player.play()
  }

  function loadVideo () {
    var video = playlist[currentPlaylistIndex]

    if (!player.isFullscreen()) {
      player.requestFullscreen()
    }

    var type
    if (video.indexOf('m3u8') > 0) {
      type = 'application/x-mpegURL'
    }

    player.src({
      type: type,
      src: video
    })
    player.play()
  }

  function onVideoEnded () {
    currentPlaylistIndex++

    if (currentPlaylistIndex === playlist.length) {
      player.exitFullscreen()

      return
    }

    loadVideo()
  }

  initialize()
})()
