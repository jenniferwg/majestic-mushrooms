export const offsetReducer = (state = 100, action) => {
  switch(action.type) {
    case 'SET_OFFSET':
      return action.offset;

    default:
      return state;
  }

};