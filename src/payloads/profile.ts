import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { EmailAddress } from "../../generated/definitions/backend/EmailAddress";
import { InitializedProfile } from "../../generated/definitions/backend/InitializedProfile";
import { validatePayload } from "../utils/validator";
import { IOResponse } from "./response";

// define here the fiscalCode used within the client communication

const mockProfile: InitializedProfile = {
  accepted_tos_version: 1,
  family_name: "Rossi",
  has_profile: true,
  is_inbox_enabled: true,
  is_email_enabled: true,
  is_email_validated: false,
  is_webhook_enabled: true,
  name: "Mario",
  version: 1,
  fiscal_code: "" as FiscalCode // injected in getProfile
};

export const getProfile = (
  fiscalCode: string
): IOResponse<InitializedProfile> => {
  return {
    // inject the fiscal code
    payload: validatePayload(InitializedProfile, {
      ...mockProfile,
      fiscal_code: fiscalCode
    }),
    isJson: true
  };
};
