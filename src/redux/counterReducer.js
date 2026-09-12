const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case "increment":
      return state + 1;

    case "decrement":
      return state - 1;

    case "INCREMENTBY2":
      return state + 2;

    case "DECREMENTBY2":
      return state - 2;
      case "INCREMENTBY5":
  return state + 5;

case "DECREMENTBY5":
  return state - 5;

    default:
      return state;
  }
};

export default counterReducer;