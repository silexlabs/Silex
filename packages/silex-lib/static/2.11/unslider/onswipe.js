// Inspired by
// https://gist.github.com/SleepWalker/da5636b1abcbaff48c4d#gistcomment-3753498
(function() {
  let touchstartX = 0
  let touchstartY = 0
  let touchendX = 0
  let touchendY = 0
  const callbacks = []

  function handleGesture() {
    const delx = touchendX - touchstartX
    const dely = touchendY - touchstartY
    if(Math.abs(delx) > Math.abs(dely)){
      if(delx > 0) return "right"
      else return "left"
    }
    else if(Math.abs(delx) < Math.abs(dely)){
      if(dely > 0) return "down"
      else return "up"
    }
    else return "tap"
  }

  const gestureZone = document.querySelector('body')
  gestureZone.addEventListener('touchstart', function(event) {
    touchstartX = event.changedTouches[0].screenX
    touchstartY = event.changedTouches[0].screenY
  }, false)

  gestureZone.addEventListener('touchend', function(event) {
    touchendX = event.changedTouches[0].screenX
    touchendY = event.changedTouches[0].screenY
    callCallbacks(handleGesture())
  }, false)

  function onSwipe(dir, cbk) {
    callbacks.push({dir, cbk})
  }

  function callCallbacks(_dir) {
    callbacks
      .filter(function({dir}) { return dir === _dir})
      .forEach(function({cbk}) { cbk() })
  }

  // expose onSwipe API
  window.onSwipe = onSwipe
})()
