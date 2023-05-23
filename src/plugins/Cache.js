exports.noCache = function (req, res, next) {
  res.header('Cache-Control', 'private,no-cache,no-store,must-revalidate,proxy-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  next()
}

exports.withCache = function (req, res, next) {
  res.header('Cache-Control', 'public,max-age=86400,immutable') // 24h
  next()
}
