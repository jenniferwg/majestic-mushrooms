import React from 'react';
import ReactDOM from 'react-dom';
import { Redirect } from 'react-router-dom';
import { Message, Divider, Table, Icon, Label } from 'semantic-ui-react';
import axios from 'axios';
import ReadMailEntry from './ReadMailEntry.jsx';
import Reply from './Reply.jsx'

const colors = [
  'red', 'orange', 'yellow', 'olive', 'green', 'teal',
  'blue', 'violet', 'purple', 'pink', 'brown', 'grey', 'black'
]; 
var currentColor = -1;


class ReadMail extends React.Component {
  constructor(props) {
    super(props);
    this.state ={
      threads: [],
      messageId: this.props.location.state.from.id,
      threadId: this.props.location.state.from.thread_id,
      currentMessage: this.props.location.state.from,
      beforeId: this.props.location.state.beforeId,
      afterId: this.props.location.state.afterId
    }
    console.log('beforeId is', this.state.beforeId);
  }

  componentDidMount() {

    // get thread
    var messageId = this.props.location.state.from.id;
    var threadId = this.props.location.state.from.thread_id;

    axios.get(`api/threads/${threadId}`)
    .then(response => {
      this.setState({threads: response.data})
    })
    .catch(error => {
        console.log('getThreads error: ', error);
    });
  }

  handleMessageClick() {
    console.log("handleMessageClick not yet built.");
  }

  handleCloseClick() {
    this.setState({redirect: true});    
  }

  handleNextClick() {
    console.log("handleNextClick not yet built.");
  }

  handleBeforeClick() {
    // need key, beforeMailId, afterMailId, handle one email click event as props
    console.log("handleBeforeClick not yet built. messages:", this.props.location.state);
  }
  
  createMarkup() {
    return {__html: this.state.currentMessage.body};
  }

  render() {
    var display = null;
    {console.log('rendering ReadMail.jsx', this.state.threads);}
    if (this.state.redirect) {
      return <Redirect push to="/" />;
    }

    return (
            
        <div>
          <Divider hidden />
          <Divider hidden />
          {this.state.threads.length === 0 ? (
            <span>Loading your messages, please wait.</span>
          ) : (
            <Table singleLine fixed>
              <Table.Header>
                <Table.Row height="100px">
                  <Table.HeaderCell colSpan='2'>Title: {this.state.currentMessage.subject}</Table.HeaderCell>
                  <Table.HeaderCell colSpan='1' textAlign='right'> 
                  {this.state.beforeId !== 'end' ? <Icon name="chevron left" onClick={this.handleBeforeClick.bind(this)}/> : null}
                  {this.state.afterId !== 'end' ? <Icon name="chevron right" onClick={this.handleNextClick.bind(this)}/> : null}
                    <Icon name="remove" onClick={this.handleCloseClick.bind(this)}/>
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {<ReadMailEntry message={this.state.threads[0]} messageId={this.state.threads[0].message_id}  />}
                <Table.Row>
                  <Table.Cell colSpan='3'>
                    <div dangerouslySetInnerHTML={this.createMarkup()} ></div>
                  </Table.Cell>
                </Table.Row>
                {this.state.threads.slice(1,this.state.threads.length).map((message, index) => {
                currentColor++;
                if (currentColor > this.state.threads.length) { currentColor = -1; }
                return <ReadMailEntry key={index} message={message} messageId={message.message_id} 
                onClick={this.handleMessageClick.bind(this)} />;
              })}
              <Table.Row><Reply /></Table.Row>
            </Table.Body> 
          </Table>
        )}
      </div>
    );
  };
};

export default ReadMail;