import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, databaseURL } from "../firebase";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function Welcome({ onCompleteProfile }) {
  const [sending, setSending] = useState(false);

  // Expense states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
 const dispatch = useDispatch();

const expenses = useSelector((state) => state.expenses);
  const counter = useSelector((state) => state.counter);

  // Edit state
  const [editingExpenseId, setEditingExpenseId] = useState(null);

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

  dispatch({
    type: "SET_EXPENSES",
    payload: expensesArray,
  });
} else {
  dispatch({
    type: "SET_EXPENSES",
    payload: [],
  });
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

      const idToken = await user.getIdToken(true);

      const expenseData = {
        amount: amount,
        description: description,
        category: category,
      };

      // If editing, update existing expense
      if (editingExpenseId) {
        const response = await fetch(
          `${databaseURL}/expenses/${user.uid}/${editingExpenseId}.json?auth=${idToken}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(expenseData),
          }
        );

        const data = await response.json();

        if (response.status !== 200) {
          throw new Error(
            data?.error ||
              "Failed to update expense."
          );
        }

        // Update screen only after successful response
       dispatch({
  type: "UPDATE_EXPENSE",
  payload: {
    id: editingExpenseId,
    amount: amount,
    description: description,
    category: category,
  },
});

        // Reset edit mode
        setEditingExpenseId(null);
        setAmount("");
        setDescription("");
        setCategory("Food");

        return;
      }

      // POST new expense
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

      const newExpense = {
        id: data.name,
        amount: amount,
        description: description,
        category: category,
      };

      dispatch({
  type: "ADD_EXPENSE",
  payload: newExpense,
});

      // Clear form
      setAmount("");
      setDescription("");
      setCategory("Food");
    } catch (error) {
      console.error("Error saving expense:", error);

      alert(
        error.message ||
          "Failed to save expense."
      );
    }
  };

  // Edit expense
  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setAmount(expense.amount);
    setDescription(expense.description);
    setCategory(expense.category);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setAmount("");
    setDescription("");
    setCategory("Food");
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login again.");
        return;
      }

      const idToken = await user.getIdToken(true);

      const response = await fetch(
        `${databaseURL}/expenses/${user.uid}/${expenseId}.json?auth=${idToken}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.status !== 200) {
        throw new Error(
          data?.error ||
            "Failed to delete expense."
        );
      }

      // Remove from screen only after successful deletion
      dispatch({
  type: "DELETE_EXPENSE",
  payload: expenseId,
});

      // If deleted expense was being edited
      if (editingExpenseId === expenseId) {
        handleCancelEdit();
      }

      console.log("Expense successfuly deleted");
    } catch (error) {
      console.error("Error deleting expense:", error);

      alert(
        error.message ||
          "Failed to delete expense."
      );
    }
  };

  const incrementFiveTimes = () => {
    dispatch({ type: "increment" });
    dispatch({ type: "increment" });
    dispatch({ type: "increment" });
    dispatch({ type: "increment" });
    dispatch({ type: "increment" });
  };

  const decrementCounter = () => {
    dispatch({ type: "decrement" });
  };

  const incrementBy2 = () => {
    dispatch({ type: "INCREMENTBY2" });
  };

  const decrementBy2 = () => {
    dispatch({ type: "DECREMENTBY2" });
  };

  const incrementBy5 = () => {
  dispatch({ type: "INCREMENTBY5" });
};

const decrementBy5 = () => {
  dispatch({ type: "DECREMENTBY5" });
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

        <h2>
          {editingExpenseId
            ? "Edit Expense"
            : "Add Daily Expense"}
        </h2>

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
            {editingExpenseId
              ? "Update Expense"
              : "Add Expense"}
          </button>

          {/* Cancel Edit */}
          {editingExpenseId && (
            <button
              type="button"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}

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

                {/* Edit / Delete buttons */}
                <div className="expense-actions">

                  <button
                    type="button"
                    onClick={() =>
                      handleEditExpense(expense)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteExpense(expense.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))
          )}

        </div>

        {/* Redux Counter */}
        <div className="redux-counter">
          <h2>Redux Counter</h2>
          <h3>Counter: {counter}</h3>

          <button type="button" onClick={incrementFiveTimes}>
            Increment by 5
          </button>

          <button type="button" onClick={decrementCounter}>
            Decrement
          </button>

          <button type="button" onClick={incrementBy2}>
            Increment by 2
          </button>

          <button type="button" onClick={decrementBy2}>
            Decrement by 2
          </button>
          <button type="button" onClick={incrementBy5}>
  IncrementBy5
</button>

<button type="button" onClick={decrementBy5}>
  DecrementBy5
</button>
        </div>

      </div>

    </div>

  );
}

export default Welcome;