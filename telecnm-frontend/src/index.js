import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createStore } from 'redux'; //get createstore method so redux store can be made
import { Provider } from 'react-redux'; //get provider component to wrap around the whole app
import rootReducer from './redux-elements/reducers/rootReducer';




const theStore = createStore(rootReducer);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store ={theStore}>

  <App />

  </Provider>
);
