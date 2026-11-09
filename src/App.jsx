import Login from "./components/Login";
import Body from "./components/Body";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./components/Profile";
import { Provider } from "react-redux";
import appStore from "./utils/appStore";
import Feed from "./components/Feed";
import Connections from "./components/connections";
import Requests from "./components/Requests";
import Chat from "./components/Chat"
import PageNotFound from "./components/PageNotFound";

function App() {
  return (
    <>
      <Provider store={appStore}>
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<Body />}>
              <Route path="/" element={<Feed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/chat/:targetUserId" element={<Chat />} />
              {/* catch-all: any URL that doesn't match one of the routes above
                  (typos, dead links, etc). Without this, React Router v6
                  renders nothing at all for an unmatched path -- not even
                  this Body layout's Navbar/Footer -- resulting in a fully
                  blank page instead of a real 404. */}
              <Route path="*" element={<PageNotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  );
}

export default App;
