import { Router } from "express";
import { InitializedProfile } from "../../generated/definitions/backend/InitializedProfile";
import { UserMetadata } from "../../generated/definitions/backend/UserMetadata";
import { fiscalCode } from "../global";
import { getProfile } from "../payloads/profile";
import { installHandler } from "../payloads/response";
import { getSuccessResponse } from "../payloads/success";
import { userMetadata } from "../payloads/userMetadata";
import { validateAndCreatePayload, validatePayload } from "../utils/validator";
const currentProfile = getProfile(fiscalCode);
// tslint:disable-next-line: no-let
let profilePayload = currentProfile.payload;
export const profileRouter = Router();
installHandler(profileRouter, "get", "/profile", () => currentProfile);
installHandler(profileRouter, "put", "/installations/:installationID", () =>
  getSuccessResponse()
);
installHandler(profileRouter, "post", "/profile", req => {
  // the server profile is merged with
  // the one coming from request. Furthermore this profile's version is increased by 1
  const clientProfileIncresed = {
    ...req.body,
    version: parseInt(req.body.version, 10) + 1
  };
  profilePayload = validatePayload(InitializedProfile, {
    ...currentProfile,
    ...clientProfileIncresed
  });
  return validateAndCreatePayload(InitializedProfile, profilePayload);
});
installHandler(profileRouter, "get", "/user-metadata", () => userMetadata);
installHandler(profileRouter, "post", "/user-metadata", req => {
  // simply validate and return the received user-metadata
  const payload = validatePayload(UserMetadata, req.body);
  return { payload };
});
