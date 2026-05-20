const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Triggered when a new document is created in the 'schools' collection.
 * Sets the 'isSchool' custom claim to true and 'isVerified' to false.
 */
exports.onSchoolRegistered = functions.firestore
  .document("schools/{uid}")
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    try {
      console.log(`Setting custom claims for school user: ${uid}`);
      await admin.auth().setCustomUserClaims(uid, {
        isSchool: true,
        isVerified: false,
      });
      console.log(`Successfully set claims for ${uid}`);
    } catch (error) {
      console.error(`Error setting claims for ${uid}:`, error);
    }
  });

/**
 * Triggered when a new document is created in the 'parents' collection.
 * Sets the 'isParent' custom claim to true.
 */
exports.onParentRegistered = functions.firestore
  .document("parents/{uid}")
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    try {
      console.log(`Setting custom claims for parent user: ${uid}`);
      await admin.auth().setCustomUserClaims(uid, {
        isParent: true,
      });
      console.log(`Successfully set claims for ${uid}`);
    } catch (error) {
      console.error(`Error setting claims for ${uid}:`, error);
    }
  });
