import { io } from "socket.io-client";
// 10.142.21.178
const url = "http://localhost:4000";

const socket = io(url);

export default socket;