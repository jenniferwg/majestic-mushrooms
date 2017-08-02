const axios = require('axios');
const bookshelf = require('../../db');
const models = require('../../db/models');
const { createMessages, createDatabaseMessageObject, createSortedMessages } = require('../utils/messagesConstructor');
const { fetchMessages, saveMessages } = require('../utils/messageHelpers');

module.exports.getAll = (req, res) => {
  models.Message.query( qb => {
    qb.orderBy('date_received', 'desc');
    qb.where('account_id', '=', req.session.accountId);
    qb.limit(100);
  }).fetchAll()
  .then( messages => {
    //if no messages stored for new user, retrieve via nylas call
    if (messages.length === 0) {
      console.log(`No messages stored for account ${req.session.accountId}. Retrieving!`);

      //start fetching messages in the background
      fetchMessages(req);

      const authString = 'Bearer ' + req.session.nylasToken;
      return axios.get('https://api.nylas.com/messages?limit=100', {
        headers: { Authorization: authString }
      })
      //retrieved messages, saving to db
      .then(response => {
        return saveMessages(response.data);
      });
      
    //if messages already exist
    } else { return messages; }
  }).catch( err => {
    console.log(`Error retrieving messages for account ${req.session.accountId}!`);
    res.status(404).send('Message retrieval failed.');
  }).then( messages => {
    console.log(`Messages successfully retrieved for account ${req.session.accountId}. Rerouting!`);
    res.status(200).send(messages);// render to the page
  });
};


module.exports.create = (req, res) => {
  console.log('Inside Messages Controller create(): ', req.body);
  const authString = 'Bearer ' + req.session.nylasToken;
  axios({
    method: 'post',
    url: 'https://api.nylas.com/send',
    headers: { Authorization: authString },
    data: req.body,
    json: true,
    responseType: 'json'
  })
  .then( message => {
    console.log('Successfully sent message to Nylas: ', message.data);
    res.status(201).send(message.data);

    new models.Message(createDatabaseMessageObject(message.data))
    .save(null, {method: 'insert'})
    .then(result => { console.log('Successfully created message in DATABASE: ', result);})
    .catch(err => { res.status(500).send(err); });
  })
  .catch( err => {
    console.log('Error posting message to Nylas: ', err);
  });
};


module.exports.getOne = (req, res) => {
  models.Message.where({ message_id: req.params.id }).fetch()
  .then(message => {
    if (!message) {
      throw message;
    }
    res.status(200).send(message);
  })
    .error(err => {
      res.status(500).send(err);
    })
    .catch(() => {
      res.sendStatus(404);
    });

  // when using Nylus call
  // const authString = 'Bearer ' + req.session.nylasToken;
  // axios.get(`https://api.nylas.com/messages/${req.params.id}`, {
  //   headers: { Authorization: authString }
  // }).then(response => {
  //   res.send(response.data);
  // })
  // .catch(err => {
  //   console.log("Retreiving one mail from Nylas: error");
  // });
};


module.exports.getMore = (req, res) => {
  models.Message.query( qb => {
    qb.offset(req.params.offset).limit(100);
    qb.orderBy('date_received', 'desc');
  }).fetchAll().then( messages => {
    if (messages.length === 0) {
      return fetchMessages(req);
    } else { return messages; }
  })
  .then( messages => {
    res.status(200).send(messages);
  })
  .catch( err => {
    console.log('Error retrieving more messages:', err);
    res.status(500).send(err);
  });
};


module.exports.update = (req, res) => {
  const authString = 'Bearer ' + req.session.nylasToken;
  let actionObj = {}; //set depending on type, e.g. trash vs. read email
  if (req.params.type === 'trash') {
    actionObj = { 'label_ids': 1 }; //@TODO: wait for folder routes, to pass in folder id
  } else if (req.params.type === 'read') {
    actionObj = { 'unread': false };
  }

  axios.put('https://api.nylas.com/messages/' + req.params.id, actionObj, {
    headers: { Authorization: authString }
  }).then(response => {
    return new models.Message({ message_id: req.params.id }).save(actionObj);
  }).catch(err => { 
    console.log(`Error updating email ${req.params.id}.`);
    res.status(400).send();
  }).then(message => {
    console.log('Message updated!');
    res.status(200).send(); 
  });
};


module.exports.deleteOne = (req, res) => {
  models.Message.where({ id: req.params.id }).fetch()
    .then(message => {
      if (!message) {
        throw message;
      }
      return message.destroy();
    })
    .then(() => {
      res.sendStatus(200);
    })
    .error(err => {
      res.status(503).send(err);
    })
    .catch(() => {
      res.sendStatus(404);
    });
};
