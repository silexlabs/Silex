// name of the local storage property
const NUM_VISITS_LOCAL_STORAGE_NAME = 'silex-caping'

function init() {
  try {
    const visitsStr = window.localStorage.getItem(NUM_VISITS_LOCAL_STORAGE_NAME)
    const _visits = visitsStr ? parseInt(visitsStr, 10) + 1 : 1
    window.localStorage.setItem(NUM_VISITS_LOCAL_STORAGE_NAME, (_visits).toString())
    return _visits
  } catch(e) {
    return -1
  }
}

// keep track of the visits
// do this once only
const visits = init()

// returns the actual visit count
export function count() {
    return visits
}

export function once(minVisits, minTimeS, name, action) {
  try {
    const done = !!window.localStorage.getItem(name)
    if(!done && visits > minVisits) {
      setTimeout(() => {
        if(!window.localStorage.getItem(name)) { // check again just in case it got run in the mean time
          window.localStorage.setItem(name, 'done')
          console.log('done')
          action()
        }
      }, minTimeS * 1000)
    }
  } catch(e) {
  }
}
