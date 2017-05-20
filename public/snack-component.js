(function () {
  'use strict'

  var mdc = window.mdc

  var MDCSnackbar = mdc.snackbar.MDCSnackbar

  var SNACKBAR_TIMEOUT = 3600000

  var snackbar

  function initialize () {
    var element = document.querySelector('#snackbar')
    snackbar = new MDCSnackbar(element)
  }

  function show (message) {
    var options = {}
    options.timeout = SNACKBAR_TIMEOUT
    options.message = message
    snackbar.show(options)
  }

  var component = {}
  component.initialize = initialize
  component.show = show

  window.SnackComponent = component
})()
