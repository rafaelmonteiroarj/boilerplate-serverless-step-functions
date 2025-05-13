require("dotenv").config();

const { handler } = require("../src/modules/orders/http/handlers/add-order");

const mockEvent = {
  name: "Order 1",
  description: "Order 1 description",
};

handler(mockEvent)
  .then((result) => console.log("Resultado:", result))
  .catch((error) => console.error("Erro:", error));
