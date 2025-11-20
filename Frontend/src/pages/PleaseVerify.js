import React from 'react';

// Simple component, you can style it later
const PleaseVerify = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Check Your Email</h2>
        <p>
          We've sent a verification link to your email address. 
          Please click the link to activate your NeuraFund account.
        </p>
        <p>
          (For local testing, the server isn't sending real emails. 
          You'll need to manually set `isEmailVerified` to `true` 
          in your MongoDB database to continue.)
        </p>
        <small>
          Once verified, please <a href="/login">log in again</a>.
        </small>
      </div>
    </div>
  );
};

export default PleaseVerify;