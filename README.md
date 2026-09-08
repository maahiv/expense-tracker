# Expense Tracker - Signup Screen

React + JavaScript signup screen based on the supplied reference image, using Firebase Email/Password Authentication.

## Run locally

```bash
npm install
npm run dev
```

## Firebase setup

The project is connected to the Firebase project used by the earlier Expense Tracker authentication work. In Firebase Console, make sure **Authentication -> Sign-in method -> Email/Password** is enabled.

## Signup requirements implemented

- Only Email, Password and Confirm Password are collected.
- All three fields are mandatory.
- The Sign up button stays disabled until all fields contain a value.
- Password and Confirm Password must match.
- Firebase `createUserWithEmailAndPassword` creates the new account.
- Firebase authentication errors are converted into user-friendly messages.
- After successful registration, the browser console prints exactly:

```text
User has successfully signed up.
```

## Where registered users are saved

Firebase Authentication creates the account in:

**Firebase Console -> Authentication -> Users**

The email/password account is stored in Firebase Authentication. It is not automatically stored in Firestore or Realtime Database unless the application separately writes a user document there.
