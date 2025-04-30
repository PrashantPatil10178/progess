import { Client, Account, Databases, ID, Query, Functions } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("67f4f367002a896d5530");

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

export const DATABASE_ID = "67f4fb3b003aa9ecbf0e";
export const USERS_COLLECTION_ID = "67f4fb8e003142cb5a85";
export const TODOS_COLLECTION_ID = "67f4fb9b000ee1e16823";
export const PROGRESS_COLLECTION_ID = "67f4fba600006af3a0cb";
export const WEEKLY_POINTS_COLLECTION_ID = "67f64035001274281ff8";
export const MONTHLY_POINTS_COLLECTION_ID = "67f6408b001bba5eeb5b";

export const OAUTH_CALLBACK_URL = window.location.origin + "/oauth-callback";

export { ID, Query };
