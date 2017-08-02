import { connect } from 'react-redux';
import { setView, setCurrentMessage, setPage, appendMessages, setOffset } from '../actions';
import EmailList from '../components/EmailList.jsx';

const mapStateToProps = (state) => {
  return {
    messages:       state.messages,
    view:           state.view,
    searchResults:  state.search.searchResults,
    page:           state.page,
    areResults:     state.search.areResults,
    offset:         state.offset
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setPage: (page) => {
      dispatch(setPage(page));
    },
    appendMessages: (messages) => {
      dispatch(appendMessages(messages));
    },
    setOffset: (offset) => {
      dispatch(setOffset(offset));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EmailList);

