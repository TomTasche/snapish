(function () {
  // redeclare dependencies to avoid linter-warnings
  var mdc = window.mdc
  var videojs = window.videojs

  var ServerBridge = window.ServerBridge

  var SnackComponent = window.SnackComponent

  var mouseDownTimestamp

  var playlist
  var currentPlaylistIndex
  var player

  function initialize () {
    mdc.autoInit()

    SnackComponent.initialize()

    var facebookLoginButton = document.querySelector('#facebook-login-button')
    facebookLoginButton.addEventListener('click', function () {
      window.location.href = '/facebook/login'
    })

    var facebookFeedButton = document.querySelector('#facebook-feed-button')
    facebookFeedButton.addEventListener('click', fetchPlaylist)

    var isLoggedIn = window.location.hash === '#facebook-logged-in'
    facebookLoginButton.disabled = isLoggedIn
    facebookLoginButton.disabled = !isLoggedIn

    initializeVideo()
  }

  function fetchPlaylist () {
    playlist = []

    currentPlaylistIndex = 0

    var promise = ServerBridge.fetchFacebookFeed()
    promise.then(function (feed) {
      for (var i = 0; i < feed.length; i++) {
        var post = feed[i]

        var videoUrl = post.source
        playlist.push(videoUrl)
      }

      var snappyButton = document.querySelector('#snappy-button')
      snappyButton.addEventListener('click', loadVideo)
      snappyButton.disabled = false
    })
  }

  function initializeVideo () {
    player = videojs('snappy-video')

    player.controls(false)
    player.preload(true)
    player.on('ended', onVideoEnded)
    player.on('mousedown', function () {
      mouseDownTimestamp = new Date().getTime()

      player.pause()
    })
    player.on('mouseup', function () {
      var nowTimestamp = new Date().getTime()

      var timestampDifference = nowTimestamp - mouseDownTimestamp
      if (timestampDifference < 1 * 1000) {
        var newTime = player.currentTime() + 5
        if (newTime >= player.duration()) {
          onVideoEnded()

          return
        }

        player.currentTime(newTime)
      }

      player.play()
    })
  }

  function loadVideo () {
    var video = playlist[currentPlaylistIndex]

    if (!player.isFullscreen) {
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
