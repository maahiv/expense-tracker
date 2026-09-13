import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, databaseURL } from "../firebase";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import {
  fetchCart,
  sendCartData,
} from "../redux/cartReducer";

function Welcome({ onCompleteProfile }) {
  const [sending, setSending] = useState(false);

  // API request status
  const [apiStatus, setApiStatus] = useState("idle");
  const [apiMessage, setApiMessage] = useState("");

  const startApiRequest = (message = "Please wait...") => {
    setApiStatus("loading");
    setApiMessage(message);
  };

  const apiRequestSuccess = (
    message = "Request successful!"
  ) => {
    setApiStatus("success");
    setApiMessage(message);
  };

  const apiRequestError = (
    message = "Something went wrong. Please try again."
  ) => {
    setApiStatus("error");
    setApiMessage(message);
  };

  const closeApiStatus = () => {
    setApiStatus("idle");
    setApiMessage("");
  };

  // Expense states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");

  const dispatch = useDispatch();

  const expenses = useSelector((state) => state.expenses);
  const counter = useSelector((state) => state.counter);
  const cart = useSelector((state) => state.cart);

  const [cartVisible, setCartVisible] = useState(false);

  // Edit state
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Total quantity in cart
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // =====================================================
  // LOAD EXPENSES + CART FROM FIREBASE ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    let unsubscribe;

    const loadExpensesAndCart = async (user) => {
      try {
        startApiRequest(
          "Sending request and loading your data..."
        );

        const idToken = await user.getIdToken(true);

        localStorage.setItem(
          "expenseTrackerToken",
          idToken
        );

        // -------------------------
        // Get Expenses
        // -------------------------

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

        // -------------------------
        // Get Cart using Thunk
        // -------------------------

        await dispatch(fetchCart()).unwrap();

        apiRequestSuccess(
          "Expenses and cart loaded successfully!"
        );

        setTimeout(closeApiStatus, 1200);
      } catch (error) {
        console.error(
          "Error loading expenses/cart:",
          error
        );

        apiRequestError(
          error.message ||
            "Failed to load your data. Please try again."
        );
      }
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadExpensesAndCart(user);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dispatch]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("expenseTrackerToken");
      dispatch(logout());
    }
  };

  // =====================================================
  // VERIFY EMAIL
  // =====================================================

  const handleVerifyEmail = async () => {
    try {
      setSending(true);

      startApiRequest(
        "Sending verification email..."
      );

      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please login again.");
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

      apiRequestSuccess(
        "Verification email sent successfully!"
      );

      setTimeout(closeApiStatus, 1200);
    } catch (error) {
      console.error(error);

      const message =
        error.message ||
        "Unable to send verification email.";

      apiRequestError(message);

      alert(message);
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // ADD / UPDATE EXPENSE
  // =====================================================

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!amount.trim() || !description.trim()) {
      alert("Please fill all expense details.");
      return;
    }

    try {
      startApiRequest(
        editingExpenseId
          ? "Updating expense..."
          : "Adding expense..."
      );

      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please login again.");
      }

      const idToken = await user.getIdToken(true);

      const expenseData = {
        amount: amount,
        description: description,
        category: category,
      };

      // -------------------------
      // Update existing expense
      // -------------------------

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

        if (!response.ok) {
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

        apiRequestSuccess(
          "Expense updated successfully!"
        );

        setTimeout(closeApiStatus, 1200);

        return;
      }

      // -------------------------
      // Add new expense
      // -------------------------

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

      if (!response.ok) {
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

      apiRequestSuccess(
        "Expense added successfully!"
      );

      setTimeout(closeApiStatus, 1200);
    } catch (error) {
      console.error(
        "Error saving expense:",
        error
      );

      const message =
        error.message ||
        "Failed to save expense.";

      apiRequestError(message);

      alert(message);
    }
  };

  // =====================================================
  // EDIT EXPENSE
  // =====================================================

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

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setAmount("");
    setDescription("");
    setCategory("Food");
  };

  // =====================================================
  // DELETE EXPENSE
  // =====================================================

  const handleDeleteExpense = async (expenseId) => {
    try {
      startApiRequest("Deleting expense...");

      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please login again.");
      }

      const idToken = await user.getIdToken(true);

      const response = await fetch(
        `${databaseURL}/expenses/${user.uid}/${expenseId}.json?auth=${idToken}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
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

      apiRequestSuccess(
        "Expense deleted successfully!"
      );

      setTimeout(closeApiStatus, 1200);
    } catch (error) {
      console.error(
        "Error deleting expense:",
        error
      );

      const message =
        error.message ||
        "Failed to delete expense.";

      apiRequestError(message);

      alert(message);
    }
  };

  // =====================================================
  // CART FUNCTIONS
  // =====================================================

  // Add item to cart and send it to Firebase
  const handleAddToCart = async (expense) => {
    try {
      startApiRequest("Adding item to cart...");

      const nextCart = [...cart];

      const existingIndex = nextCart.findIndex(
        (item) => item.id === expense.id
      );

      if (existingIndex !== -1) {
        nextCart[existingIndex] = {
          ...nextCart[existingIndex],
          quantity:
            nextCart[existingIndex].quantity + 1,
        };
      } else {
        nextCart.push({
          ...expense,
          quantity: 1,
        });
      }

      // Send cart data using createAsyncThunk
      await dispatch(
        sendCartData(nextCart)
      ).unwrap();

      // Update Redux after successful Firebase save
      dispatch({
        type: "SET_CART",
        payload: nextCart,
      });

      setCartVisible(true);

      apiRequestSuccess(
        "Item added to cart successfully!"
      );

      setTimeout(closeApiStatus, 1200);
    } catch (error) {
      console.error(
        "Error adding item to cart:",
        error
      );

      apiRequestError(
        error ||
          "Failed to add item to cart."
      );
    }
  };

  // Increase quantity and send to Firebase
  const handleIncreaseQuantity = async (id) => {
    try {
      startApiRequest("Updating cart...");

      const nextCart = cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );

      await dispatch(
        sendCartData(nextCart)
      ).unwrap();

      dispatch({
        type: "SET_CART",
        payload: nextCart,
      });

      apiRequestSuccess(
        "Cart updated successfully!"
      );

      setTimeout(closeApiStatus, 1000);
    } catch (error) {
      console.error(
        "Error updating cart:",
        error
      );

      apiRequestError(
        error ||
          "Failed to update cart."
      );
    }
  };

  // Decrease quantity and send to Firebase
  const handleDecreaseQuantity = async (id) => {
    try {
      startApiRequest("Updating cart...");

      const nextCart = cart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0);

      await dispatch(
        sendCartData(nextCart)
      ).unwrap();

      dispatch({
        type: "SET_CART",
        payload: nextCart,
      });

      apiRequestSuccess(
        "Cart updated successfully!"
      );

      setTimeout(closeApiStatus, 1000);
    } catch (error) {
      console.error(
        "Error updating cart:",
        error
      );

      apiRequestError(
        error ||
          "Failed to update cart."
      );
    }
  };

  // Remove complete item
  const handleRemoveFromCart = async (id) => {
    try {
      startApiRequest(
        "Removing item from cart..."
      );

      const nextCart = cart.filter(
        (item) => item.id !== id
      );

      await dispatch(
        sendCartData(nextCart)
      ).unwrap();

      dispatch({
        type: "SET_CART",
        payload: nextCart,
      });

      apiRequestSuccess(
        "Item removed from cart successfully!"
      );

      setTimeout(closeApiStatus, 1000);
    } catch (error) {
      console.error(
        "Error removing cart item:",
        error
      );

      apiRequestError(
        error ||
          "Failed to remove item from cart."
      );
    }
  };

  // =====================================================
  // COUNTER FUNCTIONS
  // =====================================================

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

      {/* =====================================================
          API STATUS NOTIFICATION
      ===================================================== */}

      {apiStatus !== "idle" && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            minWidth: "280px",
            padding: "18px",
            borderRadius: "10px",
            backgroundColor:
              apiStatus === "loading"
                ? "#fff3cd"
                : apiStatus === "success"
                ? "#d4edda"
                : "#f8d7da",
            border:
              apiStatus === "loading"
                ? "1px solid #ffeeba"
                : apiStatus === "success"
                ? "1px solid #c3e6cb"
                : "1px solid #f5c6cb",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <strong>
            {apiStatus === "loading"
              ? "Sending Data..."
              : apiStatus === "success"
              ? "Success"
              : "Error"}
          </strong>

          <p style={{ margin: "8px 0" }}>
            {apiMessage}
          </p>

          {apiStatus === "error" && (
            <button
              type="button"
              onClick={closeApiStatus}
            >
              Close
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          TOP BAR
      ===================================================== */}

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
          onClick={() =>
            setCartVisible(!cartVisible)
          }
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

      {/* =====================================================
          CART
      ===================================================== */}

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
                  borderBottom:
                    "1px solid #ddd",
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
                      handleDecreaseQuantity(
                        item.id
                      )
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
                      handleIncreaseQuantity(
                        item.id
                      )
                    }
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveFromCart(
                        item.id
                      )
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

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="welcome-header">

        <h1>
          Welcome to Expense Tracker!!!
        </h1>

        <div className="profile-message">
          <span>
            Your Profile is <b>64%</b> completed.
            A complete Profile has higher chances
            of landing a job.
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

      {/* =====================================================
          EXPENSE SECTION
      ===================================================== */}

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

        {/* =====================================================
            EXPENSE LIST
        ===================================================== */}

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
                      handleEditExpense(
                        expense
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteExpense(
                        expense.id
                      )
                    }
                  >
                    Delete
                  </button>

                  {/* Add To Cart */}

                  <button
                    type="button"
                    onClick={() =>
                      handleAddToCart(
                        expense
                      )
                    }
                  >
                    Add to Cart
                  </button>

                </div>
              </div>
            ))
          )}
        </div>

        {/* =====================================================
            REDUX COUNTER
        ===================================================== */}

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