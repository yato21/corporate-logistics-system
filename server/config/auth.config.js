module.exports = {
  secret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiration: 86400 // 24 hours
}; 