import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import React, { useState } from "react";

function Welcome({ onCompleteProfile }) {
  const [sending, setSending] = useState(false);

  // Expense states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState([]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("expenseTrackerToken");
      window.location.reload();
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setSending(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Please login again.");
        return;
      }

      const idToken = await user.getIdToken(true);
      const apiKey = auth.app.options.apiKey;

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestType: "VERIFY_EMAIL",
            idToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "Unable to send verification email."
        );
      }

      alert(
        "Check your email. A verification link has been sent."
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to send verification email."
      );
    } finally {
      setSending(false);
    }
  };

  // Add expense
  const handleAddExpense = (e) => {
    e.preventDefault();

    if (!amount.trim() || !description.trim()) {
      alert("Please fill all expense details.");
      return;
    }

    const newExpense = {
      id: Date.now(),
      amount: amount,
      description: description,
      category: category,
    };

    setExpenses((previousExpenses) => [
      ...previousExpenses,
      newExpense,
    ]);

    // Clear form after adding
    setAmount("");
    setDescription("");
    setCategory("Food");
  };

  return (
    <div className="welcome-page">

      {/* Logout */}
      <button
        className="logout-button"
        onClick={handleLogout}
      >
        Logout
      </button>

      {/* Header */}
      <div className="welcome-header">

        <h1>
          Welcome to Expense Tracker!!!
        </h1>

        <div className="profile-message">
          <span>
            Your Profile is <b>64%</b> completed.
            A complete Profile has higher chances of
            landing a job.
          </span>

          <button onClick={onCompleteProfile}>
            Complete now
          </button>
        </div>

        {/* Email Verification */}
        <div className="email-verification">
          <button
            onClick={handleVerifyEmail}
            disabled={sending}
          >
            {sending
              ? "Sending..."
              : "Verify Email ID"}
          </button>
        </div>

      </div>

      {/* Expense Section */}
      <div className="expense-section">

        <h2>Add Daily Expense</h2>

        <form
          className="expense-form"
          onSubmit={handleAddExpense}
        >

          {/* Amount */}
          <input
            type="number"
            placeholder="Money spent"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />

          {/* Description */}
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          {/* Category */}
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >
            <option value="Food">Food</option>
            <option value="Petrol">Petrol</option>
            <option value="Salary">Salary</option>
            <option value="Shopping">Shopping</option>
            <option value="Travel">Travel</option>
            <option value="Other">Other</option>
          </select>

          <button
            type="submit"
            disabled={
              !amount.trim() ||
              !description.trim()
            }
          >
            Add Expense
          </button>

        </form>

        {/* Expenses List */}
        <div className="expenses-list">

          <h2>My Expenses</h2>

          {expenses.length === 0 ? (
            <p className="no-expenses">
              No expenses added yet.
            </p>
          ) : (
            expenses.map((expense) => (
              <div
                className="expense-item"
                key={expense.id}
              >
                <div>
                  <strong>
                    ₹{expense.amount}
                  </strong>

                  <span>
                    {expense.description}
                  </span>
                </div>

                <span className="expense-category">
                  {expense.category}
                </span>
              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}

export default Welcome;