const axios = require('axios');
const bookshelf = require('../../db');
const models = require('../../db/models');
const { createMessages, createDatabaseMessageObject, createSortedMessages } = require('./messagesConstructor');

const fetchMessages = (req) => {
  console.log('======Fetching messages from Nylas.')
  const authString = 'Bearer ' + req.session.nylasToken;
  const today = Date.now();
  let queryStr = '';
  let retrievedMessages = [];

  return models.Account.where({ account_id: req.session.accountId}).fetch()
  .then( account => {
    let lastRetrieved = account.attributes.last_retrieved;
    if (lastRetrieved === null) {
      queryStr = 'received_after=' + (today - (86400000 * 7)); //one week back
    } else {
      lastRetrieved = lastRetrieved.parse();
      const backDate = lastRetrieved - (86400000 * 7); //another week back
      queryStr = `received_before=${lastRetrieved}&received_after=${backDate}`;
    }

    let offset = 100;

    const getMessages = () => {
      return axios.get('https://api.nylas.com/messages?' + queryStr + '&offset=' + offset, {
        headers: { Authorization: authString }
      }).then( response => {
        if (response.data.length === 0) {
          return;
        } else {
          retrievedMessages = retrievedMessages.concat(response.data);
          offset += 100;
          return saveMessages(response.data).then( saved => {
            console.log('Messages saved. Getting another 100 messages at offset:', offset);
            return getMessages();     
          })
          .catch( err => {
            console.log('Error saving messages at offset', offset + ':', err);
            throw Error;
          });
        }
      });
    }

    return getMessages();
  })
  .then( () => {
    console.log('======All messages retrieved!');
    new models.Account({ account_id: req.session.accountId }).save({ last_retrieved: new Date(today - 86400000 * 21) });
  })
  .catch( err => { 
    console.log('Error updating account:', err);
    throw Error;
  });
};

const saveMessages = (retrievedMessages) => {
  const Messages = bookshelf.Collection.extend({
    model: models.Message
  });
  messages = Messages.forge(createMessages(retrievedMessages));
  return messages.invokeThen('save', null, { method: 'insert' })
  .catch( err => {
    console.log('Error storing messages:', err);
    throw Error;
  })
  .then( messages => {
    const SortedMessages = bookshelf.Collection.extend({
      model: models.SortedMessage
    });
    let sortedMessages = SortedMessages.forge(createSortedMessages(retrievedMessages));
    sortedMessages.invokeThen('save', null, { method: 'insert' });

    return messages;
  })
  .catch( err => {
    console.log('Error storing sorted messages:', err);
    throw Error;
  });
}

module.exports = {
  fetchMessages: fetchMessages,
  saveMessages: saveMessages
}