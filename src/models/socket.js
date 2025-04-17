const socketMap = new Map();

export function registerCustomerSocket(email, socket) {
  socketMap.set(email, socket);
}

export function getCustomerSocket(email) {
  return socketMap.get(email);
}

export function removeCustomerSocket(email) {
  socketMap.delete(email);
}
