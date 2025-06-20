import  { Router } from 'express'
 
const router = Router()
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: "API Gateway OK" });
});
