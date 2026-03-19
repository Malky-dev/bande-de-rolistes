import { Router } from "express";

import {
  requestLimiter,
  verifyCsrf,
  requireAuth,
  optionalAuth,
} from "../middleware";

import listPolls from "../controllers/polls/listPolls";
import getPoll from "../controllers/polls/getPoll";
import createPoll from "../controllers/polls/createPoll";
import updatePoll from "../controllers/polls/updatePoll";
import deletePoll from "../controllers/polls/deletePoll";
import createOption from "../controllers/polls/createOption";
import updateOption from "../controllers/polls/updateOption";
import deleteOption from "../controllers/polls/deleteOption";
import replaceVote from "../controllers/polls/replaceVote";
import deleteVote from "../controllers/polls/deleteVote";

const router = Router();

router.get("/polls", requestLimiter, optionalAuth, listPolls);
router.get("/polls/:pollID", requestLimiter, optionalAuth, getPoll);

router.post("/polls", requestLimiter, verifyCsrf(), requireAuth, createPoll);
router.patch(
  "/polls/:pollID",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  updatePoll,
);
router.delete(
  "/polls/:pollID",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  deletePoll,
);

router.post(
  "/polls/:pollID/options",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  createOption,
);

router.patch(
  "/polls/:pollID/options/:optionID",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  updateOption,
);

router.delete(
  "/polls/:pollID/options/:optionID",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  deleteOption,
);

router.put(
  "/polls/:pollID/vote",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  replaceVote,
);

router.delete(
  "/polls/:pollID/vote",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  deleteVote,
);

export default router;
