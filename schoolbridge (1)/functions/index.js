const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Sets custom claims for users when they complete onboarding.
 * Note: In a real production app, you would trigger this via a secure 
 * method once Firestore data is validated.
 */
exports.setRoleClaims = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Only set claims if role is newly selected or onboarding is completed
        if (newValue.role !== previousValue.role || newValue.onboardingCompleted !== previousValue.onboardingCompleted) {
            const { role, onboardingCompleted } = newValue;
            
            if (role) {
                const claims = {
                    isSchool: role === 'school',
                    isParent: role === 'parent',
                    onboardingCompleted: !!onboardingCompleted
                };

                try {
                    await admin.auth().setCustomUserClaims(context.params.userId, claims);
                    console.log(`Custom claims set for user ${context.params.userId}:`, claims);
                } catch (error) {
                    console.error('Error setting custom claims:', error);
                }
            }
        }
    });

/**
 * Triggered on new school creation
 */
exports.onSchoolCreated = functions.firestore
    .document('schools/{schoolId}')
    .onCreate(async (snap, context) => {
        const schoolId = context.params.schoolId;
        try {
            await admin.auth().setCustomUserClaims(schoolId, {
                isSchool: true,
                isVerified: true // Auto-verified for this demo
            });
        } catch (error) {
            console.error('Error setting school claims:', error);
        }
    });
