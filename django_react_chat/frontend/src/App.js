import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import CustomRouter from "./router";

function App(props) {
  // const isLoggedIn = useSelector(state => state.session.isLoggedIn);
  // const history = useHistory();
  // const dispatch = useDispatch();
  // const store_overlay = useSelector(state => state.session.spinner_overlay);

  // const CustomRoute = ({component: Component, layout: Layout, ...rest}) => (
  //     <Route {...rest} render={props => (
  //             <Layout {...props}>
  //                 <Component {...props} />
  //             </Layout>
  //     )}/>
  // )

  return (
    <div className="App">
      <CustomRouter />
    </div>
  );
}

export default withRouter(App);
