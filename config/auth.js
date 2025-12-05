function auth(req, res, next) {
  if (req.session && req.session.userid) {
    return next();
  }

  // If not authenticated, redirect to login
  req.session.redirectTo = req.originalUrl; // Optional: remember the page
  res.redirect('/login');
}

module.exports = auth;