const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return handleUnauthorized(req, res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'localdevsecretkey12345');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.clearCookie('token');
    return handleUnauthorized(req, res);
  }
};

function handleUnauthorized(req, res) {
  // API routes always return JSON 401
  if (req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: '未授權，請先登入！' });
  }

  // Direct browser navigation to a non-API URL: show alert then redirect
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/html')) {
    res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>未登入</title>
      </head>
      <body>
        <script>
          alert("請先登入！");
          window.location.href = "/";
        </script>
      </body>
      </html>
    `);
  } else {
    res.status(401).json({ error: '未授權，請先登入！' });
  }
}
