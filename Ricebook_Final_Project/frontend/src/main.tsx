import React from "react";
import ReactDOM from "react-dom/client";
//import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";   
import { store } from "./store/store";    
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap 樣式
import "bootstrap-icons/font/bootstrap-icons.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Redux Provider 包住整個應用 */}
    <Provider store={store}>
        <App />
    </Provider>
  </React.StrictMode>
);
