import http from "node:http";
import { config } from "../config/config.js";
import { requestListener } from "./requestListener.js";

const PORT = config.LOGIN_SERVER_PORT;

const server = http.createServer(requestListener);
server.listen(PORT);
