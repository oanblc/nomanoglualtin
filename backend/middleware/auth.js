const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Yetkisiz erişim' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
};

const employeeAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'employee') {
      return res.status(403).json({ message: 'Yetkisiz erişim' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
};

const businessAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // admin, business veya 'businessPrices' iznine sahip staff erişebilir
    const isStaffWithPerm = decoded.role === 'staff'
      && Array.isArray(decoded.permissions)
      && decoded.permissions.includes('businessPrices');

    if (decoded.role !== 'admin' && decoded.role !== 'business' && !isStaffWithPerm) {
      return res.status(403).json({ message: 'Yetkisiz erişim' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Bölüm bazlı yetki kontrolü: admin her zaman geçer, staff yalnızca ilgili izne sahipse.
const requirePermission = (section) => (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (decoded.role === 'admin') {
      return next();
    }

    if (decoded.role === 'staff' && Array.isArray(decoded.permissions) && decoded.permissions.includes(section)) {
      return next();
    }

    return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
};

module.exports = { authMiddleware, employeeAuthMiddleware, businessAuthMiddleware, requirePermission };

