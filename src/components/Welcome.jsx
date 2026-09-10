import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, databaseURL } from "../firebase";
import React, { useEffect, useState } from "react";

function Welcome({ onCompleteProfile }) {
  const [sending, setSending] = useState(false);

  // Expense states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState([]);

  // Get expenses from Firebase when page loads
  useEffect(() => {
    let unsubscribe;

    const loadExpenses = async (user) => {
      try {
        const idToken = await user.getIdToken(true);

        localStorage.setItem(
          "expenseTrackerToken",
          idToken
        );

        const response = await fetch(
          `${databaseURL}/expenses/${user.uid}.json?auth=${idToken}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch expenses.");
        }

        const data = await response.json();

        if (data) {
          const expensesArray = Object.entries(data).map(
            ([id, expense]) => ({
              id,
              amount: expense.amount,
              description: expense.description,
              category: expense.category,
            })
          );

          setExpenses(expensesArray);
        } else {
          setExpenses([]);
        }
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadExpenses(user);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("expenseTrackerToken");
      window.location.reload();
    }
  };

  // Verify Email
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
  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!amount.trim() || !description.trim()) {
      alert("Please fill all expense details.");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login again.");
        return;
      }

      // Get fresh Firebase ID token
      const idToken = await user.getIdToken(true);

      // Expense data
      const expenseData = {
        amount: amount,
        description: description,
        category: category,
      };

      // POST expense to Firebase Realtime Database
      const response = await fetch(
        `${databaseURL}/expenses/${user.uid}.json?auth=${idToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expenseData),
        }
      );

      const data = await response.json();

      // Only show expense after 200 Success
      if (response.status !== 200) {
        throw new Error(
          data?.error ||
            "Failed to save expense."
        );
      }

      // Add only after successful backend response
      const newExpense = {
        id: data.name,
        amount: amount,
        description: description,
        category: category,
      };

      setExpenses((previousExpenses) => [
        ...previousExpenses,
        newExpense,
      ]);

      // Clear form
      setAmount("");
      setDescription("");
      setCategory("Food");
    } catch (error) {
      console.error("Error adding expense:", error);

      alert(
        error.message ||
          "Failed to save expense."
      );
    }
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
            onChange={(e) =>
              setAmount(e.target.value)
            }
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