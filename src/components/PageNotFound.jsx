import { Link } from "react-router-dom";

// Shown for any URL that doesn't match a defined route (e.g. a typo like
// "/requestsafafa"). Without a catch-all route, React Router v6 renders
// nothing at all for an unmatched path — not even the Navbar/Footer from
// the parent Body layout — which is why the page used to go fully blank.
const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 my-24 px-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-600">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary btn-sm">
        Go back home
      </Link>
    </div>
  );
};

export default PageNotFound;
