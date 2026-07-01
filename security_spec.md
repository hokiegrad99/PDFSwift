# Firebase Security Specifications

## 1. Data Invariants
- **Users**:
  - Email addresses must be unique.
  - A user cannot escalate their own subscription status or admin role.
  - Display names cannot be empty.
- **Usage Logs**:
  - A usage log cannot exist without a valid tool ID and email.
- **Payments**:
  - Payment transactions are ledger records; once written, they cannot be updated or deleted by normal users.

## 2. The "Dirty Dozen" Malicious Payloads
These payloads attempt to bypass authorization or corrupt data:
1. Escalating role to admin
2. Mutating subscriptionTier to "team" without payment
3. Injecting a 1MB string into user ID
4. Writing usage logs on behalf of other users
5. Overwriting a payment history record
6. Deleting system logs
7. Reading private profiles of other users
8. Registering with an empty username
9. Writing duplicate email indices
10. Modifying payment transaction amounts
11. Bypassing usage limits by writing random counts
12. Injecting malicious code strings into user metadata

## 3. Test Runner
We will deploy robust Firestore rules to deny these malicious payloads.
