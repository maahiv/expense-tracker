const cartReducer = (state = [], action) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const product = action.payload;

      const existingProduct = state.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return state.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...state,
        {
          ...product,
          quantity: 1,
        },
      ];
    }

    case "INCREASE_QUANTITY":
      return state.map((item) =>
        item.id === action.payload
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );

    case "DECREASE_QUANTITY":
      return state
        .map((item) =>
          item.id === action.payload
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0);

    case "REMOVE_FROM_CART":
      return state.filter(
        (item) => item.id !== action.payload
      );

    default:
      return state;
  }
};

export default cartReducer;