import { decryptData } from "../utils/crypto.utils.js";

export const decryptMiddleware = (req, res, next) => {
  try {
    // Get evmID from headers
    const evmId = req.headers['x-evm-id'];
    if (!evmId) {
      return res.status(400).json({ message: "Missing evmId in headers" });
    }
    // Assume req.body is an encrypted JSON string.
    const decryptedData = decryptFromEVM(req.body, evmId);
    req.decryptedData = decryptedData;
    next();
  } catch (error) {
    console.error("Error decrypting data: ", error);
    return res.status(400).json({ message: "Failed to decrypt request data" });
  }
};
