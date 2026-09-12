const expenseReducer = (state = [], action) => {
  switch (action.type) {
    case "SET_EXPENSES":
      return action.payload;

    case "ADD_EXPENSE":
      return [...state, action.payload];

    case "UPDATE_EXPENSE":
      return state.map((expense) =>
        expense.id === action.payload.id
          ? action.payload
          : expense
      );

    case "DELETE_EXPENSE":
      return state.filter(
        (expense) => expense.id !== action.payload
      );

    default:
      return state;
  }
};

export default expenseReducer;