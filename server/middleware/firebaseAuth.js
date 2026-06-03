const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
}

async function authenticateFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        message: 'Token tidak ditemukan.'
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decoded;
    next();
  } catch (error) {
    console.error('authenticateFirebaseToken error:', error);
    return res.status(401).json({
      message: 'Token Firebase tidak valid atau expired.'
    });
  }
}

module.exports = {
  authenticateFirebaseToken
};