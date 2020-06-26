import { Router } from "express";
import { range } from "fp-ts/lib/Array";
import { fromNullable } from "fp-ts/lib/Option";
import { Second } from "italia-ts-commons/lib/units";
import { sendFile } from "../server";
import { uuidv4 } from "../utils/strings";
import { activeBonus, genRandomBonusCode } from "./payloads/bonus";
import { eligibilityCheckSuccessEligible } from "./payloads/eligibility";
export const bonusVacanze = Router();

// tslint:disable-next-line: no-let
let firstBonusActivationRequestTime = 0;
// tslint:disable-next-line: no-let
let firstIseeRequestTime = 0;
// server responses with the activate bonus after
const responseBonusActivationAfter = 3 as Second;
// tslint:disable-next-line: no-let
let idEligibilityRequest: string | undefined;
// server responses with the eligibility check after
const responseIseeAfter = 3 as Second;

// return the bonus vacanze definition (it should not be used)
bonusVacanze.get("/definitions", (_, res) => {
  sendFile("assets/bonus-vacanze/specs.yaml", res);
});
// return the bonus vacanze definition (it should not be used)
bonusVacanze.get("/definitions_functions", (_, res) => {
  sendFile("assets/bonus-vacanze/specs_functions.yaml", res);
});

// tslint:disable-next-line: no-let
let idActivationBonus: string | undefined;
// generate clones of activeBonus but with different id
// tslint:disable-next-line: no-let
const aLotOfBonus = range(1, 3).map(_ => ({
  ...activeBonus,
  id: genRandomBonusCode()
}));

// Get all IDs of the bonus activations requested by
// the authenticated user or by any between his family member
bonusVacanze.get(`/activations`, (_, res) => {
  // if you want to return a list of bonus uncomment the lines below
  /*
  res.json({
    items: aLotOfBonus.map(b => ({ id: b.id, is_applicant: true }))
  });
  return;
  */

  fromNullable(idActivationBonus).foldL(
    () => {
      // No activation found.
      res.sendStatus(404);
    },

    // List of bonus activations ID activated or consumed by the authenticated user
    // or by any between his family members (former and actual)
    () => res.json({ items: [{ id: idActivationBonus, is_applicant: true }] })
  );
});

// 202 -> Processing request.
// 200 -> Bonus activation details.
// 404 -> No bonus found.
bonusVacanze.get(`/activations/:bonus_id`, (req, res) => {
  const bonus = aLotOfBonus.find(b => b.id === req.params.bonus_id);
  if (bonus) {
    res.json(bonus);
    return;
  }
  // use one of these constants to simulate different scenario
  // - activeBonus
  // - redeemedBonus
  // no task created, not-found
  if (idActivationBonus === undefined) {
    res.sendStatus(404);
    return;
  }
  const elapsedTime =
    (new Date().getTime() - firstBonusActivationRequestTime) / 1000;
  if (elapsedTime < responseBonusActivationAfter) {
    // request accepted, return the task id
    res.status(202).json({ id: activeBonus.id });
    return;
  }
  res.status(200).json(test);
});

// Start bonus activation request procedure
// 201 -> Request created.
// 201 -> Processing request.
// 409 -> Cannot activate a new bonus because another bonus related to this user was found.
// 403 -> Cannot activate a new bonus because the eligibility data has expired.
// The user must re-initiate the eligibility procedure to refresh her data
// and retry to activate the bonus within 24h since her got the result.
bonusVacanze.post(`/activations`, (_, res) => {
  // if there is no previous activation -> Request created -> send back the created id
  fromNullable(idActivationBonus).foldL(
    () => {
      idActivationBonus = activeBonus.id;
      firstBonusActivationRequestTime = new Date().getTime();
      res.status(201).json({ id: idActivationBonus });
    },
    // Cannot activate a new bonus because another bonus related to this user was found.
    () => res.sendStatus(409)
  );
});

// Start bonus eligibility check (ISEE)
// 201 -> created
// 202 -> request processing
// 409 -> pending request
// 403 -> there's already an active bonus related to this user
bonusVacanze.post("/eligibility", (_, res) => {
  if (idEligibilityRequest) {
    // a task already exists because it has been requested
    // return conflict status
    res.status(409).json({ id: idEligibilityRequest });
    return;
  }
  if (idActivationBonus) {
    // a bonus active already exists
    res.sendStatus(403);
    return;
  }
  firstIseeRequestTime = new Date().getTime();
  idEligibilityRequest = uuidv4();
  // first time return the id of the created task -> request accepted
  res.status(201).json({ id: idEligibilityRequest });
});

// Get eligibility (ISEE) check information for user's bonus
bonusVacanze.get("/eligibility", (_, res) => {
  // no task created, not-found
  if (idEligibilityRequest === undefined) {
    res.sendStatus(404);
    return;
  }
  const elapsedTime = (new Date().getTime() - firstIseeRequestTime) / 1000;
  // if elapsedTime is less than responseIseeAfter return pending status
  // first time return the id of the created task
  if (idEligibilityRequest && elapsedTime < responseIseeAfter) {
    idEligibilityRequest = undefined;
    // request accepted, return the task id
    res.status(202).json({ id: idEligibilityRequest });
    return;
  }
  // Request processed
  // use these const to simulate different scenarios
  // - success and eligible -> eligibilityCheckSuccessEligible
  // - success and ineligible -> eligibilityCheckSuccessIneligible
  // - conflict -> eligibilityCheckConflict (Eligibility check succeeded but there's already a bonus found for this set of family members.)
  // - failure (multiple error available, see ErrorEnum)-> eligibilityCheckFailure
  res.status(200).json(eligibilityCheckSuccessEligible);
});

// since all these apis implements a specific flow, if you want re-run it
// some vars must be cleaned
export const resetBonusVacanze = () => {
  idEligibilityRequest = undefined;
  firstIseeRequestTime = 0;
  idActivationBonus = undefined;
  firstBonusActivationRequestTime = 0;
};
