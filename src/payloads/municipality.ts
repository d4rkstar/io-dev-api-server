import { Municipality } from "../../generated/definitions/content/Municipality";
import { validatePayload } from "../utils/validator";

const mockMunicipality: Municipality = {
  codiceProvincia: "MI",
  codiceRegione: "YY",
  denominazione: "MOCK CITY",
  denominazioneInItaliano: "MILANO",
  denominazioneRegione: "MOCK REGIONE",
  siglaProvincia: "MI"
};

export const municipality = validatePayload(Municipality, mockMunicipality);
