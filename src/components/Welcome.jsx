import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, databaseURL } from "../firebase";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";

function Welcome({ onCompleteProfile }) {
  const [sending, setSending] = useState(false);

  // Expense states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");

  const dispatch = useDispatch();

  const expenses = useSelector((state) => state.expenses);
  const counter = useSelector((state) => state.counter);
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector((state) => state.auth.userId);

  // Cart
  const cart = useSelector((state) => state.cart);
  const [cartVisible, setCartVisible] = useState(false);

  // Edit state
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Total quantity in cart
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

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
  }, [dispatch]);

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("expenseTrackerToken");
      dispatch(logout());
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

        dispatch({
          type: "UPDATE_EXPENSE",
          payload: {
            id: editingExpenseId,
            amount: amount,
            description: description,
            category: category,
          },
        });

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

      dispatch({
        type: "DELETE_EXPENSE",
        payload: expenseId,
      });

      if (editingExpenseId === expenseId) {
        handleCancelEdit();
      }

      console.log("Expense successfully deleted");
    } catch (error) {
      console.error("Error deleting expense:", error);

      alert(
        error.message ||
          "Failed to delete expense."
      );
    }
  };

  // =========================
  // CART FUNCTIONS
  // =========================

  // Add item to cart
  const handleAddToCart = (expense) => {
    dispatch({
      type: "ADD_TO_CART",
      payload: expense,
    });

    setCartVisible(true);
  };

  // Increase quantity
  const handleIncreaseQuantity = (id) => {
    dispatch({
      type: "INCREASE_QUANTITY",
      payload: id,
    });
  };

  // Decrease quantity
  // Quantity 0 hone par cartReducer automatically remove karega
  const handleDecreaseQuantity = (id) => {
    dispatch({
      type: "DECREASE_QUANTITY",
      payload: id,
    });
  };

  // Remove complete item
  const handleRemoveFromCart = (id) => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: id,
    });
  };

  // =========================
  // COUNTER FUNCTIONS
  // =========================

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

      {/* =========================
          TOP BAR
      ========================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >

        {/* Cart Icon */}
        <button
          type="button"
          onClick={() => setCartVisible(!cartVisible)}
          style={{
            position: "relative",
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          🛒 Cart

          {cartCount > 0 && (
            <span
              style={{
                marginLeft: "8px",
                background: "red",
                color: "white",
                borderRadius: "50%",
                padding: "3px 8px",
                fontSize: "12px",
              }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      {/* =========================
          CART
      ========================= */}

      {cartVisible && (
        <div
          className="cart-box"
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            marginBottom: "25px",
            borderRadius: "10px",
          }}
        >

          <h2>My Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  borderBottom: "1px solid #ddd",
                  padding: "15px 0",
                  marginBottom: "10px",
                }}
              >

                <div>
                  <strong>
                    {item.description}
                  </strong>
                </div>

                <div>
                  Category: {item.category}
                </div>

                <div>
                  Amount: ₹{item.amount}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "10px",
                  }}
                >

                  <button
                    type="button"
                    onClick={() =>
                      handleDecreaseQuantity(item.id)
                    }
                  >
                    -
                  </button>

                  <strong>
                    {item.quantity}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      handleIncreaseQuantity(item.id)
                    }
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveFromCart(item.id)
                    }
                  >
                    Remove
                  </button>

                </div>

              </div>
            ))
          )}

        </div>
      )}

      {/* =========================
          HEADER
      ========================= */}

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

      {/* =========================
          EXPENSE SECTION
      ========================= */}

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

            <option value="Food">
              Food
            </option>

            <option value="Petrol">
              Petrol
            </option>

            <option value="Salary">
              Salary
            </option>

            <option value="Shopping">
              Shopping
            </option>

            <option value="Travel">
              Travel
            </option>

            <option value="Other">
              Other
            </option>

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

        {/* =========================
            EXPENSE LIST
        ========================= */}

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

                {/* Expense Actions */}

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

                  {/* Add To Cart */}

                  <button
                    type="button"
                    onClick={() =>
                      handleAddToCart(expense)
                    }
                  >
                    Add to Cart
                  </button>

                </div>

              </div>

            ))
          )}

        </div>

        {/* =========================
            REDUX COUNTER
        ========================= */}

        <div className="redux-counter">

          <h2>Redux Counter</h2>

          <h3>
            Counter: {counter}
          </h3>

          <button
            type="button"
            onClick={incrementFiveTimes}
          >
            Increment by 5
          </button>

          <button
            type="button"
            onClick={decrementCounter}
          >
            Decrement
          </button>

          <button
            type="button"
            onClick={incrementBy2}
          >
            Increment by 2
          </button>

          <button
            type="button"
            onClick={decrementBy2}
          >
            Decrement by 2
          </button>

          <button
            type="button"
            onClick={incrementBy5}
          >
            IncrementBy5
          </button>

          <button
            type="button"
            onClick={decrementBy5}
          >
            DecrementBy5
          </button>

        </div>

      </div>

    </div>
  );
}

export default Welcome;