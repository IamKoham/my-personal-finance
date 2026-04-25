import { Router } from 'express';
import { getRecommendations } from '../services/recommender';

const router = Router();

router.get('/', async (req, res) => {
  const recs = await getRecommendations(req.app.locals.db);
  res.json(recs);
});

export default router;
