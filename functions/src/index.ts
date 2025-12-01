
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.linkChildDevice = functions.https.onCall(async (data, context) => {
  const { pairingToken, parentUid, childUid } = data;

  if (!pairingToken || !parentUid || !childUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required data for pairing."
    );
  }

  // For this example, we'll use a simple token validation.
  // In a real-world scenario, you would have a more secure way to generate and validate tokens.
  if (pairingToken !== "valid-token") {
    return { status: "error", message: "Invalid pairing token." };
  }

  try {
    // Here you could add more logic, like checking if the parent or child is already paired.

    return { status: "success", message: "Device linked successfully." };
  } catch (error) {
    console.error("Error linking device:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while linking the device."
    );
  }
});
