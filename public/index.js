(function () {
  // redeclare dependencies to avoid linter-warnings
  var mdc = window.mdc
  var Moment = window.moment

  var ServerBridge = window.ServerBridge

  var SnackComponent = window.SnackComponent

  function initialize () {
    mdc.autoInit()

    SnackComponent.initialize()

    var playlist = ['big_buck_bunny.mp4', 'echo-hereweare.mp4']
    var currentVideo = -1

    var player = videojs('snappy-video')

    function loadNextVideo () {
      currentVideo++

      var newVideo = playlist[currentVideo]
      player.src(newVideo)
      player.play()
    }

    player.controls(false)
    player.preload(true)
    player.on('ended', loadNextVideo)
    player.on('click', function () {
      player.currentTime(player.currentTime() + 5)
    })

    loadNextVideo()
  }

  initialize()
})()
