import supertest from "supertest";
import { TransactionListResponse } from "../../generated/definitions/pagopa/TransactionListResponse";
import app, { transactionPageSize, transactions } from "../server";
const request = supertest(app);

it("services should return a valid transactions list", async done => {
  const response = await request.get("/wallet/v1/transactions");
  expect(response.status).toBe(200);
  const list = TransactionListResponse.decode(response.body);
  expect(list.isRight()).toBeTruthy();
  if (list.isRight()) {
    expect(list.value.data).toEqual(transactions.slice(0, transactionPageSize));
    expect(list.value.data?.length).toEqual(
      Math.min(transactionPageSize, transactions.length)
    );
  }
  done();
});