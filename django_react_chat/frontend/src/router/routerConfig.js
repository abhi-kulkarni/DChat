import SignIn from "../pages/Signin";
import SignUp from "../pages/Signup";
import Home from "../pages/Home";
import Chat from "../pages/Chat";
import Friends from "../pages/Friends";
import ChangePassword from "../pages/ChangePassword";
import Profile from "../pages/Profile";
import CustomMessenger from "../pages/CustomMessenger";

import CustomLayout from "../layouts/Layout";

const routes = [
  {
    path: "/",
    component: SignIn,
    layout: CustomLayout,
    exact: true,
  },
  {
    path: "/signin",
    component: SignIn,
    layout: CustomLayout,
    exact: true,
    name: "login",
  },
  {
    path: "/signup",
    component: SignUp,
    layout: CustomLayout,
    exact: true,
    name: "signup",
  },
  {
    path: "/home",
    component: Home,
    layout: CustomLayout,
    exact: true,
    name: "home",
  },
  {
    path: "/profile",
    component: Profile,
    layout: CustomLayout,
    exact: true,
    name: "profile",
  },
  {
    path: "/chat",
    component: Chat,
    layout: CustomLayout,
    exact: true,
    name: "chat",
  },
  {
    path: "/chat/:id/",
    component: Chat,
    layout: CustomLayout,
    exact: true,
    name: "chat_detail",
  },
  {
    path: "/change_password",
    component: ChangePassword,
    layout: CustomLayout,
    exact: true,
    name: "change_password",
  },
  {
    path: "/friends",
    component: Friends,
    layout: CustomLayout,
    exact: true,
    name: "friends",
  },
  {
    path: "/messenger",
    component: CustomMessenger,
    layout: CustomLayout,
    exact: true,
    name: "Messenger",
  },
  {
    path: "/messenger/conversations/:id",
    component: CustomMessenger,
    layout: CustomLayout,
    exact: true,
    name: "Messenger",
  },
  {
    path: "/messenger/groups/:id",
    component: CustomMessenger,
    layout: CustomLayout,
    exact: true,
    name: "Messenger",
  },
];

export default routes;
