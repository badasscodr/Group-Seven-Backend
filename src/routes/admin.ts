import express from 'express';

const router = express.Router();

router.get('/users', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Admin users list endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

router.get('/users/:id', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Admin get user endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;