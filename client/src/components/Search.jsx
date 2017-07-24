import React, { Component } from 'react';
import {  Grid, Header, Input } from 'semantic-ui-react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import { parseMessage } from './utils/messagesHelper';
import { today } from './utils/dateTimeHelper';


class Search extends React.Component {
  constructor(props) {
    super(props);
  }

  handleSearch(e) {
    const { setSearch } = this.props;
    const searchQuery = e.target.value;

    axios.post('api/search',searchQuery ) 
      .then(response => {
        setSearch(searchQuery, parseMessage(response.data, today));
      })
      .catch(err => { console.log('Error searching emails ', err); });
  }

  render() {
    const { view } = this.props;
    return (
      <div>
        { view === 'Search'  && 
        <Redirect from={'/'} push to={'/'}/>
        }

        <Input fluid id="searchbar"
          onKeyPress={e => { if (e.key === 'Enter') { this.handleSearch(e); } }}
          icon={{ name: 'search', circular: true }}
        />
      </div>
    );
  }
}

export default Search;
