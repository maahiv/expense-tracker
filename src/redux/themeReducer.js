const themeReducer = (state = "light", action) => {
  switch (action.type) {
    case "TOGGLE_THEME":
      return state === "light" ? "dark" : "light";

    case "SET_DARK_THEME":
      return "dark";

    case "SET_LIGHT_THEME":
      return "light";

    default:
      return state;
  }
};

export default themeReducer;