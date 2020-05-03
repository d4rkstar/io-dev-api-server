import { range } from "fp-ts/lib/Array";
import * as t from "io-ts";
import { CreatedMessageWithoutContent } from "../../generated/definitions/backend/CreatedMessageWithoutContent";
import { FiscalCode } from "../../generated/definitions/backend/FiscalCode";
import { MessageBodyMarkdown } from "../../generated/definitions/backend/MessageBodyMarkdown";
import { MessageSubject } from "../../generated/definitions/backend/MessageSubject";
import { PaginatedCreatedMessageWithoutContentCollection } from "../../generated/definitions/backend/PaginatedCreatedMessageWithoutContentCollection";
import { PaymentData } from "../../generated/definitions/backend/PaymentData";
import { PaymentNoticeNumber } from "../../generated/definitions/backend/PaymentNoticeNumber";
import { ServicePublic } from "../../generated/definitions/backend/ServicePublic";
import { Timestamp } from "../../generated/definitions/backend/Timestamp";
import { TimeToLiveSeconds } from "../../generated/definitions/backend/TimeToLiveSeconds";
import { getRandomIntInRange, getRandomStringId } from "../../src/utils/id";
import { validatePayload } from "../../src/utils/validator";
import { base64png, base64svg } from "./imagebase64";
import {
  MessageAttachment,
  MessageContent,
  MessageContentPrescription_data
} from "./newMessage";
import { IOResponse } from "./response";

/**
 * generate a list containg count messages with the given fiscal_code
 * @param count the number of messages to generate
 * @param fiscal_code
 */
const createMessage = (
  count: number,
  fiscalCode: string,
  randomId: boolean = false,
  messageId?: string
) => {
  return range(1, count).map(idx => {
    const date = new Date();
    const msgId =
      randomId === true
        ? getRandomStringId()
        : messageId
        ? messageId
        : `${idx}`.padStart(26, "0");
    // all messages have a created_at 1 month different from each other
    const dueDate = date.setMonth(date.getMonth() + (idx - 3));
    return {
      created_at: new Date(dueDate).toISOString(),
      fiscal_code: fiscalCode,
      id: msgId,
      sender_service_id: `dev-service_${idx}`,
      time_to_live: 3600
    };
  });
};

// required attributes
const CreatedMessageWithContentR = t.interface({
  id: t.string,

  fiscal_code: FiscalCode,

  created_at: Timestamp,

  content: MessageContent,

  sender_service_id: t.string
});

// optional attributes
const CreatedMessageWithContentO = t.partial({
  time_to_live: TimeToLiveSeconds
});

export const CreatedMessageWithContent = t.intersection(
  [CreatedMessageWithContentR, CreatedMessageWithContentO],
  "CreatedMessageWithContent"
);

export type CreatedMessageWithContent = t.TypeOf<
  typeof CreatedMessageWithContent
>;

const createMessageWithContent = (
  fiscalCode: string,
  serviceId: string,
  includePaymentData: boolean,
  invalidAfterDueDate: boolean,
  messageId?: string,
  dueDate?: Date,
  amount?: number
): CreatedMessageWithContent => {
  const medicalPrescription: MessageContentPrescription_data = {
    nre: "050A00854698121",
    iup: "0000X0NFM",
    prescriber_fiscal_code: "XXXXTT90A12L719R" as FiscalCode
  };
  const attachments: ReadonlyArray<MessageAttachment> = [
    { name: "attachment1", base64_content: base64png, mime_type: "image/png" },
    {
      name: "attachment2",
      base64_content: base64svg,
      mime_type: "image/svg+xml"
    }
  ];
  const msgId = messageId || getRandomStringId(26);
  const date = dueDate;
  const paymentData =
    includePaymentData === true
      ? {
          amount: amount || getRandomIntInRange(1, 10000),
          notice_number: "012345678912345678" as PaymentNoticeNumber,
          invalid_after_due_date: invalidAfterDueDate
        }
      : undefined;
  const messageContent: MessageContent = {
    subject: `subject [${serviceId}]` as MessageSubject,
    markdown: "test test test test test test test test test test test test test test test test test test test test test test test test test test" as MessageBodyMarkdown,
    due_date: date,
    payment_data: paymentData as PaymentData,
    prescription_data: medicalPrescription,
    attachments
  };
  return validatePayload(CreatedMessageWithContent, {
    content: messageContent,
    created_at: date || new Date(),
    fiscal_code: fiscalCode as FiscalCode,
    id: msgId,
    sender_service_id: serviceId,
    time_to_live: 3600 as TimeToLiveSeconds
  });
};

/**
 * return a list of count messages without content
 * @param count the number of messages
 * @param randomId if true a random if will be generated
 * @param fiscalCode the receiver fiscal code
 */
export const createMessageList = (
  count: number,
  randomId: boolean,
  fiscalCode: string
): PaginatedCreatedMessageWithoutContentCollection =>
  validatePayload(PaginatedCreatedMessageWithoutContentCollection, {
    items: createMessage(count, fiscalCode, randomId),
    page_size: count
  });

/**
 * return a message without content
 * @param messageId the id of the message to be created
 * @param fiscalCode the receiver fiscal code
 */
export const getMessage = (
  messageId: string,
  fiscalCode: string
): IOResponse<CreatedMessageWithoutContent> => {
  return {
    payload: validatePayload(
      CreatedMessageWithoutContent,
      createMessage(1, fiscalCode, false, messageId)[0]
    )
  };
};

/**
 * return a message with content
 * @param messageId the id of the message to be created
 * @param serviceId the id of the message service sender
 * @param fiscalCode the receiver fiscal code
 */
export const getMessageWithContent = (
  fiscalCode: string,
  serviceId: string,
  messageId: string,
  includePaymentData: boolean = true,
  invalidAfterDueDate: boolean = false,
  dueDate?: Date,
  amount?: number
): IOResponse<CreatedMessageWithContent> => {
  return {
    payload: validatePayload(
      CreatedMessageWithContent,
      createMessageWithContent(
        fiscalCode,
        serviceId,
        includePaymentData,
        invalidAfterDueDate,
        messageId,
        dueDate,
        amount
      )
    )
  };
};

/**
 * return a list containing count messages
 * @param count the number of message to generate
 * @param randomId if true a random id is generated, a fixed one otherwise
 */
export const getMessageWithoutContentList = (
  count: number,
  services: readonly ServicePublic[],
  fiscalCode: string,
  randomId: boolean = false
): IOResponse<PaginatedCreatedMessageWithoutContentCollection> => {
  const list = createMessageList(count, randomId, fiscalCode);
  return {
    payload: {
      ...list,
      items: list.items.map((m, idx) => {
        return {
          ...m,
          sender_service_id: services[idx % services.length].service_id
        };
      })
    },
    isJson: true
  };
};

// 404 - message NOT found
export const messagesResponseNotFound: IOResponse<string> = {
  payload: "not found",
  isJson: false,
  status: 404
};
