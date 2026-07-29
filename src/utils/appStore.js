import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import feedReducer from "./feedSlice";

const appStore=configureStore({ //this is how we create a store in redux and now we have to provide this store to the application 
    //to provide the store to the application we have to wrap our whole code inside the  provider tag given to us by the react-redux
    reducer:{
        user:userReducer,
        feed: feedReducer,
    },
});

export default appStore;