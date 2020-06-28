import bodyParser from "body-parser";
import { Application } from "express";
import express, { Response } from "express";
import { takeEnd } from "fp-ts/lib/Array";
import { fromNullable } from "fp-ts/lib/Option";
import fs from "fs";
import morgan from "morgan";
import { InitializedProfile } from "../generated/definitions/backend/InitializedProfile";
import { UserDataProcessing } from "../generated/definitions/backend/UserDataProcessing";
import { UserDataProcessingChoiceEnum } from "../generated/definitions/backend/UserDataProcessingChoice";
import { UserDataProcessingChoiceRequest } from "../generated/definitions/backend/UserDataProcessingChoiceRequest";
import { UserDataProcessingStatusEnum } from "../generated/definitions/backend/UserDataProcessingStatus";
import { UserMetadata } from "../generated/definitions/backend/UserMetadata";
import { basePath } from "../generated/definitions/backend_api_paths";
import { TransactionListResponse } from "../generated/definitions/pagopa/TransactionListResponse";
import { Wallet } from "../generated/definitions/pagopa/Wallet";
import { bonusVacanze, resetBonusVacanze } from "./bonus-vacanze/apis";
import { availableBonuses } from "./bonus-vacanze/payloads/availableBonuses";
import { backendInfo, backendStatus } from "./payloads/backend";
import { contextualHelpData } from "./payloads/contextualHelp";
import { getProblemJson, notFound } from "./payloads/error";
import { loginWithToken } from "./payloads/login";
import {
  getMessages,
  withDueDate,
  withMessageContent,
  withPaymentData
} from "./payloads/message";
import { municipality } from "./payloads/municipality";
import { getProfile } from "./payloads/profile";
import { ResponseHandler } from "./payloads/response";
import {
  getServiceMetadata,
  getServices,
  getServicesByScope,
  getServicesTuple
} from "./payloads/service";
import { session } from "./payloads/session";
import { getSuccessResponse } from "./payloads/success";
import { userMetadata } from "./payloads/userMetadata";
import { getTransactions, getWallets, sessionToken } from "./payloads/wallet";
import { validatePayload } from "./utils/validator";
import {
  frontMatter1CTA,
  frontMatter2CTA,
  frontMatter2CTA2,
  frontMatterInvalid,
  messageMarkdown
} from "./utils/variables";

// fiscalCode used within the client communication
export const fiscalCode = "RSSMRA83A12H501D";
// read package.json to print some info
const packageJson = JSON.parse(fs.readFileSync("./package.json").toString());
// create express server
const app: Application = express();

// set middlewares
// if you want to add a delay in your server, use delayer (utils/delay_middleware)
// app.use(delayer(3000 as Millisecond));
// set middleware logging
app.use(
  morgan(
    ":date[iso] :method :url :status :res[content-length] - :response-time ms"
  )
);
// support bonus vacanze
app.use(`${basePath}/bonus/vacanze`, bonusVacanze);
app.use(bodyParser.json());
const responseHandler = new ResponseHandler(app);

// setting IO backend behavior (NOTE: all exported variables and functions it's because they should be tested, to ensure the expected behavior)
// profile
// tslint:disable-next-line: no-let
let currentProfile = getProfile(fiscalCode).payload;
// services and messages
export const services = getServices(2);
const totalMessages = 2;
export const messages = getMessages(totalMessages, services, fiscalCode);
const now = new Date();
const hourAhead = new Date(now.getTime() + 60 * 1000 * 60 * 24 * 16);
export const servicesTuple = getServicesTuple(services);
export const servicesByScope = getServicesByScope(services);
const messageContents: ReadonlyArray<string> = [
  "",
  frontMatter2CTA,
  frontMatter1CTA,
  frontMatterInvalid,
  frontMatter2CTA2
];
const subs = ["Benvenuto in IO", "Scadenza Carta di Identità"];
let pym: boolean | undefined = undefined;
export const messagesWithContent = messages.payload.items.map((item, idx) => {
  const withContent = withMessageContent(
    item,
    subs[idx % subs.length],
    messageMarkdown // add front matter prefix
  );

  if (pym) {
    pym = false;
    return withDueDate(withContent, hourAhead);
  }
  if (pym === undefined) {
    pym = true;
  }
  return withContent;
});
// wallets and transactions
export const wallets = getWallets();
export const transactionPageSize = 10;
export const transactionsTotal = 1;
export const transactions = getTransactions(transactionsTotal);

// change this directory to serve differents files
export const staticContentRootPath = "/static_contents";
// define user UserDataProcessing (download / delete)
// to handle e remember user choice
type UserDeleteDownloadData = {
  [key in keyof typeof UserDataProcessingChoiceEnum]:
    | UserDataProcessing
    | undefined;
};
const initialUserChoice: UserDeleteDownloadData = {
  DOWNLOAD: undefined,
  DELETE: undefined
};
// tslint:disable-next-line: no-let
let userChoices = initialUserChoice;

// public API
app.get("/", (_, res) => {
  res.send(`Hi. This is ${packageJson.name}`);
});

app.get("/login", (_, res) => {
  res.redirect(loginWithToken);
});
app.post("/logout", (_, res) => {
  res.status(200).send("ok");
});

app.get("/info", (_, res) => {
  res.json(backendInfo);
});

app.get("/ping", (_, res) => {
  res.send("ok");
});

// backend service status
app.get("/status/backend.json", (_, res) => {
  res.json(backendStatus);
});

/** wallet content */
app.get("/wallet/v1/users/actions/start-session", (_, res) => {
  res.json(sessionToken);
});

app.get("/wallet/v1/wallet", (_, res) => {
  res.json(wallets);
});

app.post("/wallet/v1/wallet/:wallet_id/actions/favourite", (req, res) => {
  fromNullable(wallets.data)
    .chain((d: ReadonlyArray<Wallet>) => {
      const maybeWallet = d.find(
        w => w.idWallet === parseInt(req.params.wallet_id, 10)
      );
      return fromNullable(maybeWallet);
    })
    .foldL(
      () => res.sendStatus(404),
      w => res.json({ data: w })
    );
});

app.get("/wallet/v1/transactions", (req, res) => {
  const start = fromNullable(req.query.start)
    .map(s => Math.max(parseInt(s, 10), 0))
    .getOrElse(0);
  const transactionsSlice = takeEnd(
    transactions.length - Math.min(start, transactions.length),
    [...transactions]
  ).slice(0, transactionPageSize);
  const response = validatePayload(TransactionListResponse, {
    data: transactionsSlice,
    size: transactionsSlice.length,
    total: transactions.length
  });
  res.json(response);
});

/** static contents */

export const sendFile = (filePath: string, res: Response) => {
  res.sendFile(filePath, {
    root: "."
  });
};

app.get(`/content_definitions.yaml`, (_, res) => {
  sendFile("assets/yaml/content.yaml", res);
});

app.get(`${staticContentRootPath}/services/:service_id`, (req, res) => {
  const serviceId = req.params.service_id.replace(".json", "");
  if (serviceId === "servicesByScope") {
    res.json(servicesByScope.payload);
    return;
  }
  res.json(getServiceMetadata(serviceId, servicesTuple.payload).payload);
});

app.get(
  `${staticContentRootPath}/logos/organizations/:organization_id`,
  (_, res) => {
    // ignoring organization id and send always the same image
    sendFile("assets/imgs/logos/organizations/organization_1.png", res);
  }
);

app.get(`${staticContentRootPath}/logos/services/:service_id`, (_, res) => {
  // ignoring service id and send always the same image
  sendFile("assets/imgs/logos/services/service_1.png", res);
});

app.get(`${staticContentRootPath}/municipalities/:A/:B/:CODE`, (_, res) => {
  res.json(municipality);
});

// get the list of all available bonus types
app.get(
  `${staticContentRootPath}/bonus/vacanze/bonuses_available.json`,
  (_, res) => {
    res.json(availableBonuses);
  }
);

/** end static content */

app.get(`${staticContentRootPath}/contextualhelp/data.json`, (_, res) => {
  res.json(contextualHelpData);
});

// it should be useful to reset some states
app.get("/reset", (_, res) => {
  // reset profile
  currentProfile = getProfile(fiscalCode).payload;
  // reset user shoice
  userChoices = initialUserChoice;
  resetBonusVacanze();
  res.send("ok - reset");
});

/** IO backend API handlers */
responseHandler
  .addHandler("get", "/session", session)
  .addCustomHandler("get", "/profile", _ => {
    return { payload: currentProfile, isJson: true };
  })
  .addHandler("put", "/installations/:installationID", getSuccessResponse())
  .addCustomHandler("post", "/profile", req => {
    // the server profile is merged with
    // the one coming from request. Furthermore this profile's version is increased by 1
    const clintProfileIncresed = {
      ...req.body,
      version: parseInt(req.body.version, 10) + 1
    };
    currentProfile = validatePayload(InitializedProfile, {
      ...currentProfile,
      ...clintProfileIncresed
    });
    return {
      payload: currentProfile,
      isJson: true
    };
  })
  .addHandler("get", "/user-metadata", userMetadata)
  .addCustomHandler("post", "/user-metadata", req => {
    // simply validate and return the received user-metadata
    const payload = validatePayload(UserMetadata, req.body);
    return { payload };
  })
  // return messages
  .addHandler("get", "/messages", messages)
  // return a mock message with content (always found!)
  .addCustomHandler("get", "/messages/:id", req => {
    // retrieve the messageIndex from id
    const msgIndex = messages.payload.items.findIndex(
      item => item.id === req.params.id
    );
    if (msgIndex === -1) {
      return getProblemJson(404, "message not found");
    }
    return { payload: messagesWithContent[msgIndex], isJson: true };
  })
  // return services
  .addHandler("get", "/services", servicesTuple)
  /* 
    //how to send "too many requests" response
    .addHandler("get", "/services", getProblemJson(429, "too many requests"))
  */
  // return a mock service with the same requested id (always found!)
  .addCustomHandler("get", "/services/:service_id", req => {
    const service = services.find(
      item => item.service_id === req.params.service_id
    );
    return { payload: service || notFound.payload };
  })
  .addCustomHandler("get", "/user-data-processing/:choice", req => {
    const choice = req.params.choice as UserDataProcessingChoiceEnum;
    if (userChoices[choice] === undefined) {
      return getProblemJson(404);
    }
    return { payload: userChoices[choice] };
  })
  .addCustomHandler("post", "/user-data-processing", req => {
    const payload = validatePayload(UserDataProcessingChoiceRequest, req.body);
    const choice = payload.choice;
    if (userChoices[choice] !== undefined) {
      return { payload: userChoices[choice] };
    }
    const data: UserDataProcessing = {
      choice,
      status: UserDataProcessingStatusEnum.PENDING,
      version: 1
    };
    userChoices = {
      DOWNLOAD: choice === "DOWNLOAD" ? data : userChoices.DOWNLOAD,
      DELETE: choice === "DELETE" ? data : userChoices.DELETE
    };
    return { payload: userChoices[choice] };
  })
  // return positive feedback on request to receive a new email to verify the email address
  .addHandler("post", "/email-validation-process", {
    status: 202,
    payload: undefined
  });

export default app;
